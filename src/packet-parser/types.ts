/** A single parsed field value with metadata for display. */
export interface ParsedField {
  name: string;
  typeName: string;
  value: ParsedValue;
  offset: number;
  size: number;
}

/** Discriminated union for all possible parsed values. */
export type ParsedValue =
  | { kind: "number"; value: number; display?: string }
  | { kind: "bigint"; value: string }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "flags"; value: number; flags: { name: string; set: boolean }[] }
  | { kind: "enum"; value: number; name: string }
  | { kind: "struct"; fields: ParsedField[] }
  | { kind: "array"; items: ParsedValue[]; elementType: string };

/** Result of parsing a full packet. */
export interface ParseResult {
  success: boolean;
  fields: ParsedField[];
  error?: string;
  bytesConsumed: number;
  bytesRemaining: number;
}
