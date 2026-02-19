import { PacketDefinition } from "../../definitions";
import { AuraLog } from "./shared";

// ============================================================
// Aura/Buff Packets
// ============================================================

export const auraDefinitions: PacketDefinition[] = [
  // SMSG_PERIODICAURALOG (0x024E) - Periodic aura ticks (DoTs, HoTs)
  {
    opcode: 0x024e,
    name: "SMSG_PERIODICAURALOG",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "target", type: "PackedGuid" },
      { kind: "primitive", name: "caster", type: "PackedGuid" },
      { kind: "primitive", name: "spell", type: "u32" },
      { kind: "primitive", name: "amount_of_auras", type: "u32" },
      {
        kind: "array",
        name: "auras",
        count: "amount_of_auras",
        elementType: AuraLog,
      },
    ],
  },

  // SMSG_UPDATE_AURA_DURATION (0x0137) - Updates aura duration
  {
    opcode: 0x0137,
    name: "SMSG_UPDATE_AURA_DURATION",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "slot", type: "u8" },
      { kind: "primitive", name: "duration", type: "u32" },
    ],
  },
];
