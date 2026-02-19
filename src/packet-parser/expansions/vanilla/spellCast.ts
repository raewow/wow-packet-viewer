import { PacketDefinition } from "../../definitions";
import { SpellCastTargets, CastFlags } from "./shared";

// ============================================================
// Spell Casting Packets
// ============================================================

export const spellCastDefinitions: PacketDefinition[] = [
  // CMSG_CAST_SPELL (0x012E) - Client requests to cast spell
  {
    opcode: 0x012e,
    name: "CMSG_CAST_SPELL",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "spell", type: "u32" },
      SpellCastTargets,
    ],
  },

  // SMSG_SPELL_START (0x0131) - Spell cast begins (cast bar)
  {
    opcode: 0x0131,
    name: "SMSG_SPELL_START",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "cast_item", type: "PackedGuid" },
      { kind: "primitive", name: "caster", type: "PackedGuid" },
      { kind: "primitive", name: "spell", type: "u32" },
      { kind: "flags", name: "flags", flagsDef: CastFlags },
      { kind: "primitive", name: "timer", type: "u32" },
      SpellCastTargets,
      // if (flags & AMMO)
      {
        kind: "if_flag",
        field: "flags",
        flag: 0x0020,
        fields: [
          { kind: "primitive", name: "ammo_display_id", type: "u32" },
          { kind: "primitive", name: "ammo_inventory_type", type: "u32" },
        ],
      },
    ],
  },
];
