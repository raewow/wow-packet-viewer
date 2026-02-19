import { PacketDefinition } from "../../definitions";
import { HitInfo, DamageInfo, DamageType } from "./shared";

// ============================================================
// Combat Packets
// ============================================================

export const combatDefinitions: PacketDefinition[] = [
  // CMSG_ATTACKSWING (0x0141) - Client initiates auto-attack
  {
    opcode: 0x0141,
    name: "CMSG_ATTACKSWING",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // SMSG_ATTACKSTART (0x0143) - Server confirms combat started
  {
    opcode: 0x0143,
    name: "SMSG_ATTACKSTART",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "attacker", type: "Guid" },
      { kind: "primitive", name: "victim", type: "Guid" },
    ],
  },

  // SMSG_ATTACKSTOP (0x0144) - Combat ended
  {
    opcode: 0x0144,
    name: "SMSG_ATTACKSTOP",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "player", type: "PackedGuid" },
      { kind: "primitive", name: "enemy", type: "PackedGuid" },
      { kind: "primitive", name: "unknown1", type: "u32" },
    ],
  },

  // SMSG_ATTACKERSTATEUPDATE (0x01F2) - Detailed melee damage
  {
    opcode: 0x01f2,
    name: "SMSG_ATTACKERSTATEUPDATE",
    direction: "SMSG",
    fields: [
      { kind: "flags", name: "hit_info", flagsDef: HitInfo },
      { kind: "primitive", name: "attacker", type: "PackedGuid" },
      { kind: "primitive", name: "victim", type: "PackedGuid" },
      { kind: "primitive", name: "total_damage", type: "u32" },
      { kind: "primitive", name: "damage_count", type: "u8" },
      {
        kind: "array",
        name: "damages",
        count: "damage_count",
        elementType: DamageInfo,
      },
      { kind: "primitive", name: "damage_state", type: "u32" },
      { kind: "primitive", name: "spell_id", type: "u32" },
      { kind: "primitive", name: "blocked_amount", type: "u32" },
    ],
  },

  // SMSG_ENVIRONMENTALDAMAGELOG (0x01FC) - Environmental damage (fall, drowning, etc.)
  {
    opcode: 0x01fc,
    name: "SMSG_ENVIRONMENTALDAMAGELOG",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "victim", type: "PackedGuid" },
      { kind: "enum", name: "damage_type", enumDef: DamageType },
      { kind: "primitive", name: "damage", type: "u32" },
      { kind: "primitive", name: "absorb", type: "u32" },
      { kind: "primitive", name: "resist", type: "u32" },
    ],
  },

  // SMSG_AI_REACTION (0x013C) - AI reaction to player
  {
    opcode: 0x013c,
    name: "SMSG_AI_REACTION",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "reaction", type: "u32" },
    ],
  },
];
