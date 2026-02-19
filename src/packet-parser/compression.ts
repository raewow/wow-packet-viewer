import { inflate } from "pako";
import { DecompressionResult } from "./definitions";

/**
 * Decompress a WoW compressed packet payload.
 *
 * Wire format:
 *   - bytes[0..3]: u32 LE uncompressed_size
 *   - bytes[4..]:  zlib-compressed data
 */
export function decompressWowPacket(data: number[]): DecompressionResult {
  if (data.length < 5) {
    throw new Error(
      `Compressed packet too short: ${data.length} bytes (need at least 5)`
    );
  }

  const declaredSize =
    data[0] |
    (data[1] << 8) |
    (data[2] << 16) |
    ((data[3] << 24) >>> 0);

  const compressedBytes = new Uint8Array(data.slice(4));
  const compressedSize = compressedBytes.length;

  const decompressed = inflate(compressedBytes);
  const actualSize = decompressed.length;

  return {
    data: Array.from(decompressed),
    declaredSize,
    actualSize,
    compressedSize,
  };
}
