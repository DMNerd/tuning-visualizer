// Compact binary payloads for share links: unsigned LEB128 varints and
// length-prefixed UTF-8 strings.

export class ByteWriter {
  private bytes: number[] = [];

  u8(value: number): this {
    this.bytes.push(value & 0xff);
    return this;
  }

  varint(value: number): this {
    let rest = Math.max(0, Math.floor(value));
    while (rest >= 0x80) {
      this.bytes.push((rest % 0x80) | 0x80);
      rest = Math.floor(rest / 0x80);
    }
    this.bytes.push(rest);
    return this;
  }

  string(value: string): this {
    const encoded = new TextEncoder().encode(value);
    this.varint(encoded.length);
    encoded.forEach((byte) => this.bytes.push(byte));
    return this;
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

// Every read throws RangeError past the end or on malformed data; callers
// decoding untrusted input catch it once around the whole decode.
export class ByteReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.offset >= this.bytes.length;
  }

  u8(): number {
    if (this.done) throw new RangeError("Unexpected end of data");
    return this.bytes[this.offset++];
  }

  varint(): number {
    let value = 0;
    let scale = 1;
    // 7 groups cover 2^49, well past any value these payloads carry.
    for (let i = 0; i < 7; i += 1) {
      const byte = this.u8();
      value += (byte & 0x7f) * scale;
      if (byte < 0x80) return value;
      scale *= 0x80;
    }
    throw new RangeError("Varint too long");
  }

  string(): string {
    const length = this.varint();
    if (length > this.bytes.length - this.offset) {
      throw new RangeError("String runs past the end of data");
    }
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder("utf-8", { fatal: true }).decode(slice);
  }
}
