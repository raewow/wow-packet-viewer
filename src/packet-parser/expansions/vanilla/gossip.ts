import { PacketDefinition } from "../../definitions";
import { GossipItem, QuestItem } from "./shared";

// ============================================================
// Gossip/NPC Dialog Packets
// ============================================================

export const gossipDefinitions: PacketDefinition[] = [
  // CMSG_GOSSIP_HELLO (0x017B) - Client interacts with NPC
  {
    opcode: 0x017b,
    name: "CMSG_GOSSIP_HELLO",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // SMSG_GOSSIP_MESSAGE (0x017D) - Server sends gossip options
  {
    opcode: 0x017d,
    name: "SMSG_GOSSIP_MESSAGE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "title_text_id", type: "u32" },
      { kind: "primitive", name: "amount_of_gossip_items", type: "u32" },
      {
        kind: "array",
        name: "gossips",
        count: "amount_of_gossip_items",
        elementType: GossipItem,
      },
      { kind: "primitive", name: "amount_of_quests", type: "u32" },
      {
        kind: "array",
        name: "quests",
        count: "amount_of_quests",
        elementType: QuestItem,
      },
    ],
  },

  // SMSG_GOSSIP_COMPLETE (0x017E) - Server closes gossip window
  {
    opcode: 0x017e,
    name: "SMSG_GOSSIP_COMPLETE",
    direction: "SMSG",
    fields: [],
  },
];
