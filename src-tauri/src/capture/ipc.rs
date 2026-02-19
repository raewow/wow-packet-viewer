use serde::Serialize;
use std::ffi::c_void;
use windows::core::PCWSTR;
use windows::Win32::Foundation::{CloseHandle, HANDLE};
use windows::Win32::System::Memory::{
    MapViewOfFile, OpenFileMappingW, UnmapViewOfFile, FILE_MAP_ALL_ACCESS, MEMORY_MAPPED_VIEW_ADDRESS,
};

/// Magic value the DLL writes into the shared memory header to signal
/// that the ring buffer is initialised.
const RING_MAGIC: u32 = 0x57535059;

#[repr(C)]
pub struct PacketRingHeader {
    pub magic: u32,        // 0x57535059
    pub write_pos: u32,    // written by DLL
    pub read_pos: u32,     // written by host
    pub capacity: u32,     // data area size
    pub dll_ready: u32,    // 1 when DLL hooks installed
    pub build_number: u32, // detected build
}

/// A single entry in the ring buffer, immediately followed by
/// `data_len` bytes of packet payload.
#[repr(C)]
pub struct PacketEntry {
    pub total_size: u32,
    pub timestamp: u32,
    pub direction: u8,
    pub _pad: [u8; 3],
    pub opcode: u32,
    pub data_len: u32,
}

const ENTRY_HEADER_SIZE: usize = std::mem::size_of::<PacketEntry>(); // 20 bytes

/// Packet data read from shared memory and ready for the application layer.
#[derive(Debug, Clone, Serialize)]
pub struct RawPacket {
    pub timestamp: u32,
    pub direction: u8, // 0=SMSG, 1=CMSG
    pub opcode: u32,
    pub data: Vec<u8>,
}

/// Reads packets from the DLL-side shared-memory ring buffer.
pub struct SharedMemoryReader {
    mapping: HANDLE,
    view: *mut u8,
    capacity: u32,
}

// SharedMemoryReader is only accessed from one async task at a time.
unsafe impl Send for SharedMemoryReader {}
unsafe impl Sync for SharedMemoryReader {}

impl SharedMemoryReader {
    /// Open an existing shared-memory region created by the capture DLL in the
    /// target process.  The name follows the pattern `Local\WowCapture_{pid}`.
    pub fn open(pid: u32) -> Result<Self, String> {
        let name = format!("Local\\WowCapture_{}", pid);
        let wide_name: Vec<u16> = name.encode_utf16().chain(Some(0)).collect();

        unsafe {
            let mapping = OpenFileMappingW(
                FILE_MAP_ALL_ACCESS.0,
                false,
                PCWSTR(wide_name.as_ptr()),
            )
            .map_err(|e| format!("OpenFileMappingW failed: {}", e))?;

            let view = MapViewOfFile(mapping, FILE_MAP_ALL_ACCESS, 0, 0, 0);
            if view.Value.is_null() {
                let _ = CloseHandle(mapping);
                return Err("MapViewOfFile returned NULL".to_string());
            }

            let base = view.Value as *mut u8;

            // Validate magic
            let header = &*(base as *const PacketRingHeader);
            if header.magic != RING_MAGIC {
                let _ = UnmapViewOfFile(MEMORY_MAPPED_VIEW_ADDRESS { Value: base as *mut c_void });
                let _ = CloseHandle(mapping);
                return Err(format!(
                    "Bad magic in shared memory: 0x{:08X} (expected 0x{:08X})",
                    header.magic, RING_MAGIC
                ));
            }

            let capacity = header.capacity;

            Ok(Self {
                mapping,
                view: base,
                capacity,
            })
        }
    }

    /// Returns `true` once the DLL signals that its hooks are installed.
    pub fn is_ready(&self) -> bool {
        unsafe {
            let header = &*(self.view as *const PacketRingHeader);
            std::ptr::read_volatile(&header.dll_ready) == 1
        }
    }

    /// Read all available packets from the ring buffer and advance `read_pos`.
    pub fn read_packets(&self) -> Vec<RawPacket> {
        let mut packets = Vec::new();

        unsafe {
            let header = self.view as *mut PacketRingHeader;
            let data_base = self.view.add(std::mem::size_of::<PacketRingHeader>());

            let write_pos = std::ptr::read_volatile(&(*header).write_pos);
            let mut read_pos = std::ptr::read_volatile(&(*header).read_pos);
            let cap = self.capacity;

            // Nothing to read
            if read_pos == write_pos {
                return packets;
            }

            // Calculate how many bytes are available
            let available = if write_pos >= read_pos {
                write_pos - read_pos
            } else {
                cap - read_pos + write_pos
            };

            let mut consumed: u32 = 0;

            while consumed < available {
                // Read the entry header, handling wrap-around
                let mut entry_bytes = [0u8; ENTRY_HEADER_SIZE];
                ring_read(data_base, cap, read_pos, &mut entry_bytes);

                let entry = &*(entry_bytes.as_ptr() as *const PacketEntry);
                let total_size = entry.total_size;

                // Sanity check
                if total_size < ENTRY_HEADER_SIZE as u32
                    || total_size > cap
                    || entry.data_len > (total_size - ENTRY_HEADER_SIZE as u32)
                {
                    // Corrupted entry; reset read_pos to write_pos to skip
                    break;
                }

                // Read payload
                let data_len = entry.data_len as usize;
                let mut payload = vec![0u8; data_len];
                let payload_offset = (read_pos + ENTRY_HEADER_SIZE as u32) % cap;
                ring_read(data_base, cap, payload_offset, &mut payload);

                packets.push(RawPacket {
                    timestamp: entry.timestamp,
                    direction: entry.direction,
                    opcode: entry.opcode,
                    data: payload,
                });

                read_pos = (read_pos + total_size) % cap;
                consumed += total_size;
            }

            // Commit our new read position
            std::ptr::write_volatile(&mut (*header).read_pos, read_pos);
        }

        packets
    }

    /// Explicitly close the shared memory mapping.
    pub fn close(&mut self) {
        unsafe {
            if !self.view.is_null() {
                let _ = UnmapViewOfFile(MEMORY_MAPPED_VIEW_ADDRESS {
                    Value: self.view as *mut c_void,
                });
                self.view = std::ptr::null_mut();
            }
            if !self.mapping.is_invalid() {
                let _ = CloseHandle(self.mapping);
                self.mapping = HANDLE::default();
            }
        }
    }
}

impl Drop for SharedMemoryReader {
    fn drop(&mut self) {
        self.close();
    }
}

/// Copy `dst.len()` bytes from a ring buffer starting at `offset`,
/// handling wrap-around at `capacity`.
unsafe fn ring_read(base: *const u8, capacity: u32, offset: u32, dst: &mut [u8]) {
    let cap = capacity as usize;
    let off = offset as usize;
    let len = dst.len();

    if off + len <= cap {
        // No wrap
        std::ptr::copy_nonoverlapping(base.add(off), dst.as_mut_ptr(), len);
    } else {
        // Wraps around
        let first_chunk = cap - off;
        std::ptr::copy_nonoverlapping(base.add(off), dst.as_mut_ptr(), first_chunk);
        std::ptr::copy_nonoverlapping(base, dst.as_mut_ptr().add(first_chunk), len - first_chunk);
    }
}
