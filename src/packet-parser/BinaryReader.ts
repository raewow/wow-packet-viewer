export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

export class BinaryReader {
  private data: Uint8Array;
  private pos: number = 0;

  constructor(data: number[]) {
    this.data = new Uint8Array(data);
  }

  get offset(): number {
    return this.pos;
  }

  get remaining(): number {
    return this.data.length - this.pos;
  }

  get length(): number {
    return this.data.length;
  }

  get hasMore(): boolean {
    return this.pos < this.data.length;
  }

  private ensure(n: number): void {
    if (this.pos + n > this.data.length) {
      throw new ParseError(
        `Unexpected end of data: need ${n} bytes at offset ${this.pos}, ` +
          `but only ${this.remaining} remain (total length: ${this.data.length})`
      );
    }
  }

  readU8(): number {
    this.ensure(1);
    return this.data[this.pos++];
  }

  readI8(): number {
    const v = this.readU8();
    return v > 127 ? v - 256 : v;
  }

  readU16(): number {
    this.ensure(2);
    const v = this.data[this.pos] | (this.data[this.pos + 1] << 8);
    this.pos += 2;
    return v;
  }

  readI16(): number {
    const v = this.readU16();
    return v > 32767 ? v - 65536 : v;
  }

  readU32(): number {
    this.ensure(4);
    const v =
      this.data[this.pos] |
      (this.data[this.pos + 1] << 8) |
      (this.data[this.pos + 2] << 16) |
      ((this.data[this.pos + 3] << 24) >>> 0);
    this.pos += 4;
    return v >>> 0; // ensure unsigned
  }

  readI32(): number {
    this.ensure(4);
    const v =
      this.data[this.pos] |
      (this.data[this.pos + 1] << 8) |
      (this.data[this.pos + 2] << 16) |
      (this.data[this.pos + 3] << 24);
    this.pos += 4;
    return v;
  }

  readU64(): bigint {
    this.ensure(8);
    const lo = BigInt(this.readU32());
    const hi = BigInt(this.readU32());
    return (hi << 32n) | lo;
  }

  readF32(): number {
    this.ensure(4);
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, this.data[this.pos + i]);
    }
    this.pos += 4;
    return view.getFloat32(0, true);
  }

  readCString(): string {
    const start = this.pos;
    while (this.pos < this.data.length && this.data[this.pos] !== 0) {
      this.pos++;
    }
    if (this.pos >= this.data.length) {
      throw new ParseError(
        `CString not null-terminated starting at offset ${start}`
      );
    }
    const bytes = this.data.slice(start, this.pos);
    this.pos++; // skip null terminator
    return new TextDecoder().decode(bytes);
  }

  readGuid(): string {
    const val = this.readU64();
    return "0x" + val.toString(16).toUpperCase().padStart(16, "0");
  }

  readBool(): boolean {
    return this.readU8() !== 0;
  }

  /** Read a PackedGuid (variable-length GUID encoding used in WoW). */
  readPackedGuid(): string {
    const mask = this.readU8();
    let guid = 0n;
    for (let i = 0; i < 8; i++) {
      if (mask & (1 << i)) {
        guid |= BigInt(this.readU8()) << BigInt(i * 8);
      }
    }
    return "0x" + guid.toString(16).toUpperCase().padStart(16, "0");
  }

  readBytes(count: number): number[] {
    this.ensure(count);
    const result = Array.from(this.data.slice(this.pos, this.pos + count));
    this.pos += count;
    return result;
  }
}
