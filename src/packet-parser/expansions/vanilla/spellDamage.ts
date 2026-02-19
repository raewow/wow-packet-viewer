import { PacketDefinition } from "../../definitions";
import { SpellSchool, HitInfo, Power } from "./shared";

// ============================================================
// Spell Damage/Healing Packets
// ============================================================

export const spellDamageDefinitions: PacketDefinition[] = [
  // SMSG_SPELLNONMELEEDAMAGELOG (0x0250) - Spell damage dealt
  {
    opcode: 0x0250,
    name: "SMSG_SPELLNONMELEEDAMAGELOG",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "target", type: "PackedGuid" },
      { kind: "primitive", name: "attacker", type: "PackedGuid" },
      { kind: "primitive", name: "spell", type: "u32" },
      { kind: "primitive", name: "damage", type: "u32" },
      { kind: "enum", name: "school", enumDef: SpellSchool },
      { kind: "primitive", name: "absorbed_damage", type: "u32" },
      { kind: "primitive", name: "resisted", type: "u32" },
      { kind: "primitive", name: "periodic_log", type: "u8" }, // Bool
      { kind: "primitive", name: "unused", type: "u8" },
      { kind: "primitive", name: "blocked", type: "u32" },
      { kind: "flags", name: "hit_info", flagsDef: HitInfo },
      { kind: "primitive", name: "extend_flag", type: "u8" },
    ],
  },

  // SMSG_SPELLHEALLOG (0x0150) - Healing done
  {
    opcode: 0x0150,
    name: "SMSG_SPELLHEALLOG",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "victim", type: "PackedGuid" },
      { kind: "primitive", name: "caster", type: "PackedGuid" },
      { kind: "primitive", name: "id", type: "u32" },
      { kind: "primitive", name: "damage", type: "u32" },
      { kind: "primitive", name: "critical", type: "u8" }, // Bool
    ],
  },

  // SMSG_SPELLENERGIZELOG (0x0151) - Mana/energy/rage gain
  {
    opcode: 0x0151,
    name: "SMSG_SPELLENERGIZELOG",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "victim", type: "PackedGuid" },
      { kind: "primitive", name: "caster", type: "PackedGuid" },
      { kind: "primitive", name: "spell", type: "u32" },
      { kind: "enum", name: "power", enumDef: Power },
      { kind: "primitive", name: "damage", type: "u32" },
    ],
  },
];
