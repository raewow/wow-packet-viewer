import { BinaryReader } from "./BinaryReader";
import { ParsedValue } from "./types";

/** Primitive type names supported by the system. */
export type PrimitiveType =
  | "u8"
  | "i8"
  | "u16"
  | "i16"
  | "u32"
  | "i32"
  | "u64"
  | "f32"
  | "bool"
  | "CString"
  | "Guid"
  | "PackedGuid";

/** Enum definition: maps numeric values to names. */
export interface EnumDef {
  type: PrimitiveType;
  values: Record<number, string>;
}

/** Flags definition: maps bit values to flag names. */
export interface FlagsDef {
  type: PrimitiveType;
  flags: { name: string; value: number }[];
}

/** Condition for match branches. */
export type Condition =
  | { kind: "flag"; field: string; flag: number }
  | { kind: "equals"; field: string; values: number[] };

/**
 * A field definition in a packet structure.
 * Each variant describes how to read one logical field from the binary stream.
 */
export type FieldDef =
  | { kind: "primitive"; name: string; type: PrimitiveType }
  | { kind: "enum"; name: string; enumDef: EnumDef }
  | { kind: "flags"; name: string; flagsDef: FlagsDef }
  | { kind: "struct"; name: string; fields: FieldDef[] }
  | {
      kind: "array";
      name: string;
      elementType: FieldDef;
      count: number | string;
    }
  | {
      kind: "custom";
      name: string;
      typeName: string;
      read: (reader: BinaryReader) => ParsedValue;
    }
  | {
      kind: "if_flag";
      field: string;
      flag: number;
      fields: FieldDef[];
    }
  | {
      kind: "match";
      branches: Array<{ condition: Condition; fields: FieldDef[] }>;
    };

/** Result of decompressing a compressed packet payload. */
export interface DecompressionResult {
  /** The decompressed payload bytes. */
  data: number[];
  /** The declared uncompressed size from the packet header. */
  declaredSize: number;
  /** The actual decompressed size. */
  actualSize: number;
  /** The size of the compressed payload (excluding the size header). */
  compressedSize: number;
}

/** Describes how a compressed packet should be decompressed. */
export interface CompressionInfo {
  /** The opcode whose definition should be used to parse the decompressed data. */
  innerOpcode: number;
  /** Decompresses the raw packet data. */
  decompress: (data: number[]) => DecompressionResult;
}

/** A complete packet definition with all metadata. */
export interface PacketDefinition {
  opcode: number;
  name: string;
  direction: "CMSG" | "SMSG";
  fields: FieldDef[];
  /** If present, this packet contains compressed data wrapping another packet format. */
  compression?: CompressionInfo;
}
