import { PacketDefinition, FieldDef } from "../../definitions";
import { BinaryReader } from "../../BinaryReader";
import { ParsedField, ParsedValue } from "../../types";
import { decompressWowPacket } from "../../compression";
import {
  UpdateType,
  ObjectType,
  UpdateFlag,
  MovementFlags,
  SplineFlag,
  Vector3d,
} from "./shared";

// ============================================================
// SMSG_UPDATE_OBJECT (0x00A9)
// ============================================================

// --- UpdateMask ---

const VANILLA_UPDATE_FIELDS: Record<number, string> = {
  0: "OBJECT_GUID",
  1: "OBJECT_GUID+1",
  2: "OBJECT_TYPE",
  3: "OBJECT_ENTRY",
  4: "OBJECT_SCALE_X",
  22: "UNIT_HEALTH",
  23: "UNIT_POWER1",
  24: "UNIT_POWER2",
  25: "UNIT_POWER3",
  26: "UNIT_POWER4",
  27: "UNIT_POWER5",
  28: "UNIT_MAXHEALTH",
  29: "UNIT_MAXPOWER1",
  30: "UNIT_MAXPOWER2",
  31: "UNIT_MAXPOWER3",
  32: "UNIT_MAXPOWER4",
  33: "UNIT_MAXPOWER5",
  34: "UNIT_LEVEL",
  35: "UNIT_FACTIONTEMPLATE",
  36: "UNIT_BYTES_0",
  131: "UNIT_DISPLAYID",
  132: "UNIT_NATIVEDISPLAYID",
};

function readUpdateMask(reader: BinaryReader): ParsedValue {
  const blockCount = reader.readU8();

  // Read bitmask blocks
  const maskBlocks: number[] = [];
  for (let i = 0; i < blockCount; i++) {
    maskBlocks.push(
      reader.readU8() |
        (reader.readU8() << 8) |
        (reader.readU8() << 16) |
        ((reader.readU8() << 24) >>> 0)
    );
  }

  // Read values for each set bit
  const fields: ParsedField[] = [];
  for (let block = 0; block < blockCount; block++) {
    for (let bit = 0; bit < 32; bit++) {
      if (maskBlocks[block] & (1 << bit)) {
        const index = block * 32 + bit;
        const fieldOffset = reader.offset;
        const value = reader.readU32();
        const name =
          VANILLA_UPDATE_FIELDS[index] ??
          `FIELD_0x${index.toString(16).toUpperCase().padStart(4, "0")}`;
        fields.push({
          name,
          typeName: "u32",
          value: {
            kind: "number",
            value,
            display: `${value} (0x${(value >>> 0).toString(16).toUpperCase()})`,
          },
          offset: fieldOffset,
          size: 4,
        });
      }
    }
  }

  return { kind: "struct", fields };
}

const UpdateMask: FieldDef = {
  kind: "custom",
  name: "update_mask",
  typeName: "UpdateMask",
  read: readUpdateMask,
};

// --- MovementBlock ---

const MovementBlock: FieldDef = {
  kind: "struct",
  name: "MovementBlock",
  fields: [
    { kind: "flags", name: "update_flag", flagsDef: UpdateFlag },

    // if (update_flag & LIVING) ... else if (update_flag & HAS_POSITION)
    {
      kind: "match",
      branches: [
        {
          condition: { kind: "flag", field: "update_flag", flag: 0x20 }, // LIVING
          fields: [
            { kind: "flags", name: "flags", flagsDef: MovementFlags },
            { kind: "primitive", name: "timestamp", type: "u32" },
            {
              kind: "struct",
              name: "living_position",
              fields: [
                { kind: "primitive", name: "x", type: "f32" },
                { kind: "primitive", name: "y", type: "f32" },
                { kind: "primitive", name: "z", type: "f32" },
              ],
            },
            { kind: "primitive", name: "living_orientation", type: "f32" },

            // if (flags & ON_TRANSPORT)
            {
              kind: "if_flag",
              field: "flags",
              flag: 0x02000000,
              fields: [
                {
                  kind: "primitive",
                  name: "transport_guid",
                  type: "PackedGuid",
                },
                {
                  kind: "struct",
                  name: "transport_position",
                  fields: [
                    { kind: "primitive", name: "x", type: "f32" },
                    { kind: "primitive", name: "y", type: "f32" },
                    { kind: "primitive", name: "z", type: "f32" },
                  ],
                },
                {
                  kind: "primitive",
                  name: "transport_orientation",
                  type: "f32",
                },
              ],
            },

            // if (flags & SWIMMING)
            {
              kind: "if_flag",
              field: "flags",
              flag: 0x00200000,
              fields: [{ kind: "primitive", name: "pitch", type: "f32" }],
            },

            { kind: "primitive", name: "fall_time", type: "f32" },

            // if (flags & JUMPING)
            {
              kind: "if_flag",
              field: "flags",
              flag: 0x00002000,
              fields: [
                { kind: "primitive", name: "z_speed", type: "f32" },
                { kind: "primitive", name: "cos_angle", type: "f32" },
                { kind: "primitive", name: "sin_angle", type: "f32" },
                { kind: "primitive", name: "xy_speed", type: "f32" },
              ],
            },

            // if (flags & SPLINE_ELEVATION)
            {
              kind: "if_flag",
              field: "flags",
              flag: 0x04000000,
              fields: [
                { kind: "primitive", name: "spline_elevation", type: "f32" },
              ],
            },

            // Speeds (always present in LIVING)
            { kind: "primitive", name: "walking_speed", type: "f32" },
            { kind: "primitive", name: "running_speed", type: "f32" },
            {
              kind: "primitive",
              name: "backwards_running_speed",
              type: "f32",
            },
            { kind: "primitive", name: "swimming_speed", type: "f32" },
            {
              kind: "primitive",
              name: "backwards_swimming_speed",
              type: "f32",
            },
            { kind: "primitive", name: "turn_rate", type: "f32" },

            // if (flags & SPLINE_ENABLED)
            {
              kind: "if_flag",
              field: "flags",
              flag: 0x08000000,
              fields: [
                {
                  kind: "flags",
                  name: "spline_flags",
                  flagsDef: SplineFlag,
                },

                // Spline final destination (match on spline_flags)
                {
                  kind: "match",
                  branches: [
                    {
                      condition: {
                        kind: "flag",
                        field: "spline_flags",
                        flag: 0x00040000,
                      }, // FINAL_ANGLE
                      fields: [
                        { kind: "primitive", name: "angle", type: "f32" },
                      ],
                    },
                    {
                      condition: {
                        kind: "flag",
                        field: "spline_flags",
                        flag: 0x00020000,
                      }, // FINAL_TARGET
                      fields: [
                        { kind: "primitive", name: "target", type: "u64" },
                      ],
                    },
                    {
                      condition: {
                        kind: "flag",
                        field: "spline_flags",
                        flag: 0x00010000,
                      }, // FINAL_POINT
                      fields: [
                        {
                          kind: "struct",
                          name: "spline_final_point",
                          fields: [
                            { kind: "primitive", name: "x", type: "f32" },
                            { kind: "primitive", name: "y", type: "f32" },
                            { kind: "primitive", name: "z", type: "f32" },
                          ],
                        },
                      ],
                    },
                  ],
                },

                { kind: "primitive", name: "time_passed", type: "u32" },
                { kind: "primitive", name: "duration", type: "u32" },
                { kind: "primitive", name: "id", type: "u32" },
                {
                  kind: "primitive",
                  name: "amount_of_nodes",
                  type: "u32",
                },
                {
                  kind: "array",
                  name: "nodes",
                  elementType: Vector3d,
                  count: "amount_of_nodes",
                },
                {
                  kind: "struct",
                  name: "final_node",
                  fields: [
                    { kind: "primitive", name: "x", type: "f32" },
                    { kind: "primitive", name: "y", type: "f32" },
                    { kind: "primitive", name: "z", type: "f32" },
                  ],
                },
              ],
            },
          ],
        },
        {
          condition: { kind: "flag", field: "update_flag", flag: 0x40 }, // HAS_POSITION
          fields: [
            {
              kind: "struct",
              name: "position",
              fields: [
                { kind: "primitive", name: "x", type: "f32" },
                { kind: "primitive", name: "y", type: "f32" },
                { kind: "primitive", name: "z", type: "f32" },
              ],
            },
            { kind: "primitive", name: "orientation", type: "f32" },
          ],
        },
      ],
    },

    // Independent flag checks (not else-if)
    {
      kind: "if_flag",
      field: "update_flag",
      flag: 0x08, // HIGH_GUID
      fields: [{ kind: "primitive", name: "unknown0", type: "u32" }],
    },
    {
      kind: "if_flag",
      field: "update_flag",
      flag: 0x10, // ALL
      fields: [{ kind: "primitive", name: "unknown1", type: "u32" }],
    },
    {
      kind: "if_flag",
      field: "update_flag",
      flag: 0x04, // MELEE_ATTACKING
      fields: [{ kind: "primitive", name: "guid", type: "PackedGuid" }],
    },
    {
      kind: "if_flag",
      field: "update_flag",
      flag: 0x02, // TRANSPORT
      fields: [
        {
          kind: "primitive",
          name: "transport_progress_in_ms",
          type: "u32",
        },
      ],
    },
  ],
};

// --- Object ---

const UpdateObject: FieldDef = {
  kind: "struct",
  name: "Object",
  fields: [
    { kind: "enum", name: "update_type", enumDef: UpdateType },

    {
      kind: "match",
      branches: [
        {
          // VALUES
          condition: { kind: "equals", field: "update_type", values: [0] },
          fields: [
            { kind: "primitive", name: "guid", type: "PackedGuid" },
            UpdateMask,
          ],
        },
        {
          // MOVEMENT
          condition: { kind: "equals", field: "update_type", values: [1] },
          fields: [
            { kind: "primitive", name: "guid", type: "PackedGuid" },
            MovementBlock,
          ],
        },
        {
          // CREATE_OBJECT, CREATE_OBJECT2
          condition: { kind: "equals", field: "update_type", values: [2, 3] },
          fields: [
            { kind: "primitive", name: "guid", type: "PackedGuid" },
            { kind: "enum", name: "object_type", enumDef: ObjectType },
            MovementBlock,
            UpdateMask,
          ],
        },
        {
          // OUT_OF_RANGE_OBJECTS, NEAR_OBJECTS
          condition: { kind: "equals", field: "update_type", values: [4, 5] },
          fields: [
            { kind: "primitive", name: "count", type: "u32" },
            {
              kind: "array",
              name: "guids",
              elementType: {
                kind: "primitive",
                name: "guid",
                type: "PackedGuid",
              },
              count: "count",
            },
          ],
        },
      ],
    },
  ],
};

// --- SMSG_UPDATE_OBJECT ---

const SMSG_UPDATE_OBJECT: PacketDefinition = {
  opcode: 0x00a9,
  name: "SMSG_UPDATE_OBJECT",
  direction: "SMSG",
  fields: [
    { kind: "primitive", name: "amount_of_objects", type: "u32" },
    { kind: "primitive", name: "has_transport", type: "u8" },
    {
      kind: "array",
      name: "objects",
      elementType: UpdateObject,
      count: "amount_of_objects",
    },
  ],
};

// --- SMSG_COMPRESSED_UPDATE_OBJECT (0x01F6) ---

const SMSG_COMPRESSED_UPDATE_OBJECT: PacketDefinition = {
  opcode: 0x01f6,
  name: "SMSG_COMPRESSED_UPDATE_OBJECT",
  direction: "SMSG",
  fields: [
    { kind: "primitive", name: "uncompressed_size", type: "u32" },
    {
      kind: "custom",
      name: "compressed_data",
      typeName: "CompressedBlob",
      read: (reader) => ({
        kind: "string",
        value: `${reader.remaining} bytes of zlib data`,
      }),
    },
  ],
  compression: {
    innerOpcode: 0x00a9,
    decompress: decompressWowPacket,
  },
};

export const updateObjectDefinitions: PacketDefinition[] = [
  SMSG_UPDATE_OBJECT,
  SMSG_COMPRESSED_UPDATE_OBJECT,
];
