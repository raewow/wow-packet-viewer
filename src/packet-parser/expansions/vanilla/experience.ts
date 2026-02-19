import { PacketDefinition } from "../../definitions";
import { ExperienceAwardType } from "./shared";

// ============================================================
// Experience/Progression Packets
// ============================================================

export const experienceDefinitions: PacketDefinition[] = [
  // SMSG_LOG_XPGAIN (0x01D0) - Experience award notification
  {
    opcode: 0x01d0,
    name: "SMSG_LOG_XPGAIN",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "target", type: "Guid" },
      { kind: "primitive", name: "total_exp", type: "u32" },
      { kind: "enum", name: "exp_type", enumDef: ExperienceAwardType },
      {
        kind: "match",
        branches: [
          {
            condition: { kind: "equals", field: "exp_type", values: [1] }, // NON_KILL
            fields: [
              { kind: "primitive", name: "experience_without_rested", type: "u32" },
              { kind: "primitive", name: "exp_group_bonus", type: "f32" },
            ],
          },
        ],
      },
    ],
  },
];
