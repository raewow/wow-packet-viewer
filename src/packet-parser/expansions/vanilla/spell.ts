import { PacketDefinition } from "../../definitions";
import { InitialSpell, CooldownSpell, ItemClass } from "./shared";

// ============================================================
// Spell System Packets
// ============================================================

export const spellDefinitions: PacketDefinition[] = [
  // SMSG_INITIAL_SPELLS (0x012A) - Player's spell book and cooldowns
  {
    opcode: 0x012a,
    name: "SMSG_INITIAL_SPELLS",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "unknown1", type: "u8" },
      { kind: "primitive", name: "spell_count", type: "u16" },
      {
        kind: "array",
        name: "initial_spells",
        count: "spell_count",
        elementType: InitialSpell,
      },
      { kind: "primitive", name: "cooldown_count", type: "u16" },
      {
        kind: "array",
        name: "cooldowns",
        count: "cooldown_count",
        elementType: CooldownSpell,
      },
    ],
  },

  // SMSG_SPELL_GO (0x0132) - Spell cast notification
  // Note: This is a simplified version for vanilla 1.12
  {
    opcode: 0x0132,
    name: "SMSG_SPELL_GO",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "cast_item", type: "PackedGuid" },
      { kind: "primitive", name: "caster", type: "PackedGuid" },
      { kind: "primitive", name: "spell", type: "u32" },
      { kind: "primitive", name: "flags", type: "u16" },
      { kind: "primitive", name: "amount_of_hits", type: "u8" },
      {
        kind: "array",
        name: "hits",
        count: "amount_of_hits",
        elementType: { kind: "primitive", name: "guid", type: "Guid" },
      },
      { kind: "primitive", name: "amount_of_misses", type: "u8" },
      // TODO: Add SpellMiss struct for miss array
      // For now, we'll skip miss details and just handle the simple case
    ],
  },

  // SMSG_SET_PROFICIENCY (0x0127) - Set item proficiency
  {
    opcode: 0x0127,
    name: "SMSG_SET_PROFICIENCY",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "class", enumDef: ItemClass },
      { kind: "primitive", name: "item_sub_class_mask", type: "u32" },
    ],
  },

  // SMSG_SET_FLAT_SPELL_MODIFIER (0x0266) - Set flat spell modifier
  {
    opcode: 0x0266,
    name: "SMSG_SET_FLAT_SPELL_MODIFIER",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "eff", type: "u8" },
      { kind: "primitive", name: "op", type: "u8" },
      { kind: "primitive", name: "value", type: "u32" },
    ],
  },

  // SMSG_SET_PCT_SPELL_MODIFIER (0x0267) - Set percentage spell modifier
  {
    opcode: 0x0267,
    name: "SMSG_SET_PCT_SPELL_MODIFIER",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "eff", type: "u8" },
      { kind: "primitive", name: "op", type: "u8" },
      { kind: "primitive", name: "value", type: "u32" },
    ],
  },
];
