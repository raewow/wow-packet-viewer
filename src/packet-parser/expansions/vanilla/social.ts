import { PacketDefinition } from "../../definitions";
import { Friend } from "./shared";

// ============================================================
// Social System Packets (Friends, Ignore List)
// ============================================================

export const socialDefinitions: PacketDefinition[] = [
  // SMSG_FRIEND_LIST (0x0067) - Friend list with status information
  {
    opcode: 0x0067,
    name: "SMSG_FRIEND_LIST",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "amount_of_friends", type: "u8" },
      {
        kind: "array",
        name: "friends",
        count: "amount_of_friends",
        elementType: Friend,
      },
    ],
  },

  // SMSG_IGNORE_LIST (0x006B) - List of ignored players
  {
    opcode: 0x006b,
    name: "SMSG_IGNORE_LIST",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "amount_of_ignored", type: "u8" },
      {
        kind: "array",
        name: "ignored",
        count: "amount_of_ignored",
        elementType: { kind: "primitive", name: "guid", type: "Guid" },
      },
    ],
  },

  // SMSG_PARTYKILLLOG (0x01F5) - Party member kill notification
  {
    opcode: 0x01f5,
    name: "SMSG_PARTYKILLLOG",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "player_with_killing_blow", type: "Guid" },
      { kind: "primitive", name: "victim", type: "Guid" },
    ],
  },
];
