import { PacketDefinition } from "../../definitions";

// ============================================================
// Loot System Packets
// ============================================================

export const lootDefinitions: PacketDefinition[] = [
  // CMSG_LOOT (0x015D) - Client requests to loot a corpse/object
  {
    opcode: 0x015d,
    name: "CMSG_LOOT",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // SMSG_LOOT_RESPONSE (0x0160) - Server sends loot window contents
  {
    opcode: 0x0160,
    name: "SMSG_LOOT_RESPONSE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "loot_method", type: "u8" },
      {
        kind: "match",
        branches: [
          {
            condition: { kind: "equals", field: "loot_method", values: [0] }, // ERROR
            fields: [{ kind: "primitive", name: "loot_error", type: "u8" }],
          },
        ],
      },
      { kind: "primitive", name: "gold", type: "u32" },
      { kind: "primitive", name: "amount_of_items", type: "u8" },
      {
        kind: "array",
        name: "items",
        count: "amount_of_items",
        elementType: {
          kind: "struct",
          name: "LootItem",
          fields: [
            { kind: "primitive", name: "index", type: "u8" },
            { kind: "primitive", name: "item", type: "u32" },
            { kind: "primitive", name: "ty", type: "u8" },
          ],
        },
      },
    ],
  },

  // CMSG_AUTOSTORE_LOOT_ITEM (0x0108) - Client auto-loots an item
  {
    opcode: 0x0108,
    name: "CMSG_AUTOSTORE_LOOT_ITEM",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "item_slot", type: "u8" }],
  },

  // SMSG_LOOT_REMOVED (0x0162) - Server notifies item was taken
  {
    opcode: 0x0162,
    name: "SMSG_LOOT_REMOVED",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "slot", type: "u8" }],
  },

  // CMSG_LOOT_RELEASE (0x015F) - Client closes loot window
  {
    opcode: 0x015f,
    name: "CMSG_LOOT_RELEASE",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },
];
