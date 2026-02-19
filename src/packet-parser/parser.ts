import { BinaryReader, ParseError } from "./BinaryReader";
import { Condition, FieldDef, PacketDefinition, PrimitiveType } from "./definitions";
import { ParsedField, ParsedValue, ParseResult } from "./types";

function readPrimitive(reader: BinaryReader, type: PrimitiveType): ParsedValue {
  switch (type) {
    case "u8":
      return { kind: "number", value: reader.readU8() };
    case "i8":
      return { kind: "number", value: reader.readI8() };
    case "u16":
      return { kind: "number", value: reader.readU16() };
    case "i16":
      return { kind: "number", value: reader.readI16() };
    case "u32":
      return { kind: "number", value: reader.readU32() };
    case "i32":
      return { kind: "number", value: reader.readI32() };
    case "u64":
      return { kind: "bigint", value: reader.readGuid() };
    case "f32":
      return { kind: "number", value: reader.readF32() };
    case "bool":
      return { kind: "bool", value: reader.readBool() };
    case "CString":
      return { kind: "string", value: reader.readCString() };
    case "Guid":
      return { kind: "bigint", value: reader.readGuid() };
    case "PackedGuid":
      return { kind: "bigint", value: reader.readPackedGuid() };
    default:
      throw new ParseError(`Unknown primitive type: ${type}`);
  }
}

function evaluateCondition(
  condition: Condition,
  context: Map<string, number>
): boolean {
  const val = context.get(condition.field) ?? 0;
  if (condition.kind === "flag") {
    return (val & condition.flag) !== 0;
  } else {
    return condition.values.includes(val);
  }
}

function readField(
  reader: BinaryReader,
  def: FieldDef,
  context: Map<string, number>
): ParsedField {
  const startOffset = reader.offset;
  let value: ParsedValue;

  switch (def.kind) {
    case "primitive": {
      value = readPrimitive(reader, def.type);
      if (value.kind === "number") {
        context.set(def.name, value.value);
      }
      break;
    }

    case "enum": {
      const rawValue = readPrimitive(reader, def.enumDef.type);
      const numVal = (rawValue as { kind: "number"; value: number }).value;
      const name = def.enumDef.values[numVal] ?? `UNKNOWN(${numVal})`;
      value = { kind: "enum", value: numVal, name };
      context.set(def.name, numVal);
      break;
    }

    case "flags": {
      const rawValue = readPrimitive(reader, def.flagsDef.type);
      const numVal = (rawValue as { kind: "number"; value: number }).value;
      const flags = def.flagsDef.flags.map((f) => ({
        name: f.name,
        set: (numVal & f.value) !== 0,
      }));
      value = { kind: "flags", value: numVal, flags };
      context.set(def.name, numVal);
      break;
    }

    case "struct": {
      const fields = readFields(reader, def.fields, context);
      value = { kind: "struct", fields };
      break;
    }

    case "array": {
      const count =
        typeof def.count === "number"
          ? def.count
          : context.get(def.count) ?? 0;

      const items: ParsedValue[] = [];
      let elementType = "unknown";
      if (def.elementType.kind === "primitive")
        elementType = def.elementType.type;
      else if (def.elementType.kind === "struct")
        elementType = def.elementType.name;
      else if (def.elementType.kind === "enum") elementType = def.name;

      for (let i = 0; i < count; i++) {
        const field = readField(reader, def.elementType, context);
        items.push(field.value);
      }
      value = { kind: "array", items, elementType };
      break;
    }

    case "custom": {
      value = def.read(reader);
      break;
    }

    default:
      throw new ParseError(`Unexpected field kind in readField`);
  }

  return {
    name: def.name,
    typeName: getTypeName(def),
    value,
    offset: startOffset,
    size: reader.offset - startOffset,
  };
}

/**
 * Read a list of field definitions, handling conditional (if_flag, match) by
 * flattening their children into the result when conditions are met.
 */
function readFields(
  reader: BinaryReader,
  defs: FieldDef[],
  context: Map<string, number>
): ParsedField[] {
  const fields: ParsedField[] = [];
  for (const def of defs) {
    switch (def.kind) {
      case "if_flag": {
        const val = context.get(def.field) ?? 0;
        if ((val & def.flag) !== 0) {
          fields.push(...readFields(reader, def.fields, context));
        }
        break;
      }
      case "match": {
        for (const branch of def.branches) {
          if (evaluateCondition(branch.condition, context)) {
            fields.push(...readFields(reader, branch.fields, context));
            break;
          }
        }
        break;
      }
      default:
        fields.push(readField(reader, def, context));
    }
  }
  return fields;
}

function getTypeName(def: FieldDef): string {
  switch (def.kind) {
    case "primitive":
      return def.type;
    case "enum":
      return `enum(${def.enumDef.type})`;
    case "flags":
      return `flags(${def.flagsDef.type})`;
    case "struct":
      return def.name;
    case "array": {
      const inner = getTypeName(def.elementType);
      return `${inner}[${def.count}]`;
    }
    case "custom":
      return def.typeName;
    default:
      return "unknown";
  }
}

/** Parse a packet's raw data given its definition. */
export function parsePacket(
  data: number[],
  definition: PacketDefinition
): ParseResult {
  const reader = new BinaryReader(data);
  const context = new Map<string, number>();
  const fields: ParsedField[] = [];

  try {
    for (const fieldDef of definition.fields) {
      switch (fieldDef.kind) {
        case "if_flag": {
          const val = context.get(fieldDef.field) ?? 0;
          if ((val & fieldDef.flag) !== 0) {
            fields.push(...readFields(reader, fieldDef.fields, context));
          }
          break;
        }
        case "match": {
          for (const branch of fieldDef.branches) {
            if (evaluateCondition(branch.condition, context)) {
              fields.push(...readFields(reader, branch.fields, context));
              break;
            }
          }
          break;
        }
        default:
          fields.push(readField(reader, fieldDef, context));
      }
    }
    return {
      success: true,
      fields,
      bytesConsumed: reader.offset,
      bytesRemaining: reader.remaining,
    };
  } catch (e) {
    return {
      success: false,
      fields,
      error: e instanceof ParseError ? e.message : String(e),
      bytesConsumed: reader.offset,
      bytesRemaining: reader.remaining,
    };
  }
}
