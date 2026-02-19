import { PacketDefinition } from "../../definitions";
import { SpellLog, SpellLogMiss } from "./shared";

// ============================================================
// Spell Log Packets
// ============================================================

export const spellLogDefinitions: PacketDefinition[] = [
  // SMSG_SPELLLOGEXECUTE (0x024C) - Detailed spell effect logs
  {
    opcode: 0x024c,
    name: "SMSG_SPELLLOGEXECUTE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "caster", type: "PackedGuid" },
      { kind: "primitive", name: "spell", type: "u32" },
      { kind: "primitive", name: "amount_of_effects", type: "u32" },
      {
        kind: "array",
        name: "logs",
        count: "amount_of_effects",
        elementType: SpellLog,
      },
    ],
  },

  // SMSG_SPELLLOGMISS (0x024B) - Spell misses/resists
  {
    opcode: 0x024b,
    name: "SMSG_SPELLLOGMISS",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "id", type: "u32" },
      { kind: "primitive", name: "caster", type: "Guid" },
      { kind: "primitive", name: "unknown1", type: "u8" },
      { kind: "primitive", name: "amount_of_targets", type: "u32" },
      {
        kind: "array",
        name: "targets",
        count: "amount_of_targets",
        elementType: SpellLogMiss,
      },
    ],
  },
];
