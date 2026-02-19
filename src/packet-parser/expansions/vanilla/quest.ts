import { PacketDefinition } from "../../definitions";
import { QuestItemReward, QuestDetailsEmote, NpcTextUpdateEmote, QuestItemRequirement, QuestObjective, Vector2d } from "./shared";

// ============================================================
// Quest System Packets
// ============================================================

export const questDefinitions: PacketDefinition[] = [
  // CMSG_QUESTGIVER_HELLO (0x0184) - Client initiates quest dialog
  {
    opcode: 0x0184,
    name: "CMSG_QUESTGIVER_HELLO",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // CMSG_QUESTGIVER_ACCEPT_QUEST (0x0189) - Client accepts quest
  {
    opcode: 0x0189,
    name: "CMSG_QUESTGIVER_ACCEPT_QUEST",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "quest_id", type: "u32" },
    ],
  },

  // CMSG_QUESTGIVER_COMPLETE_QUEST (0x018A) - Client completes quest
  {
    opcode: 0x018a,
    name: "CMSG_QUESTGIVER_COMPLETE_QUEST",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "quest_id", type: "u32" },
    ],
  },

  // CMSG_QUESTGIVER_CHOOSE_REWARD (0x018E) - Client chooses quest reward
  {
    opcode: 0x018e,
    name: "CMSG_QUESTGIVER_CHOOSE_REWARD",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "quest_id", type: "u32" },
      { kind: "primitive", name: "reward", type: "u32" },
    ],
  },

  // CMSG_QUEST_QUERY (0x005C) - Client requests quest information
  {
    opcode: 0x005c,
    name: "CMSG_QUEST_QUERY",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "quest_id", type: "u32" }],
  },

  // SMSG_QUESTGIVER_QUEST_DETAILS (0x0188) - Server sends quest details
  {
    opcode: 0x0188,
    name: "SMSG_QUESTGIVER_QUEST_DETAILS",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "quest_id", type: "u32" },
      { kind: "primitive", name: "title", type: "CString" },
      { kind: "primitive", name: "details", type: "CString" },
      { kind: "primitive", name: "objectives", type: "CString" },
      { kind: "primitive", name: "auto_finish", type: "u32" }, // Bool32
      { kind: "primitive", name: "amount_of_choice_item_rewards", type: "u32" },
      {
        kind: "array",
        name: "choice_item_rewards",
        count: "amount_of_choice_item_rewards",
        elementType: QuestItemReward,
      },
      { kind: "primitive", name: "amount_of_item_rewards", type: "u32" },
      {
        kind: "array",
        name: "item_rewards",
        count: "amount_of_item_rewards",
        elementType: QuestItemReward,
      },
      { kind: "primitive", name: "money_reward", type: "u32" }, // Gold
      { kind: "primitive", name: "reward_spell", type: "u32" }, // Spell
      { kind: "primitive", name: "amount_of_emotes", type: "u32" },
      {
        kind: "array",
        name: "emotes",
        count: "amount_of_emotes",
        elementType: QuestDetailsEmote,
      },
    ],
  },

  // SMSG_QUESTGIVER_OFFER_REWARD (0x018D) - Quest reward offer
  {
    opcode: 0x018d,
    name: "SMSG_QUESTGIVER_OFFER_REWARD",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "npc", type: "Guid" },
      { kind: "primitive", name: "quest_id", type: "u32" },
      { kind: "primitive", name: "title", type: "CString" },
      { kind: "primitive", name: "offer_reward_text", type: "CString" },
      { kind: "primitive", name: "auto_finish", type: "u32" }, // Bool32
      { kind: "primitive", name: "amount_of_emotes", type: "u32" },
      {
        kind: "array",
        name: "emotes",
        count: "amount_of_emotes",
        elementType: NpcTextUpdateEmote,
      },
      { kind: "primitive", name: "amount_of_choice_item_rewards", type: "u32" },
      {
        kind: "array",
        name: "choice_item_rewards",
        count: "amount_of_choice_item_rewards",
        elementType: QuestItemRequirement,
      },
      { kind: "primitive", name: "amount_of_item_rewards", type: "u32" },
      {
        kind: "array",
        name: "item_rewards",
        count: "amount_of_item_rewards",
        elementType: QuestItemRequirement,
      },
      { kind: "primitive", name: "money_reward", type: "u32" }, // Gold
      { kind: "primitive", name: "reward_spell", type: "u32" }, // Spell
      { kind: "primitive", name: "reward_spell_cast", type: "u32" }, // Spell
    ],
  },

  // SMSG_QUESTGIVER_QUEST_COMPLETE (0x0191) - Quest completion response
  {
    opcode: 0x0191,
    name: "SMSG_QUESTGIVER_QUEST_COMPLETE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "quest_id", type: "u32" },
      { kind: "primitive", name: "unknown", type: "u32" }, // Set to 0x03
      { kind: "primitive", name: "experience_reward", type: "u32" },
      { kind: "primitive", name: "money_reward", type: "u32" }, // Gold
      { kind: "primitive", name: "amount_of_item_rewards", type: "u32" },
      {
        kind: "array",
        name: "item_rewards",
        count: "amount_of_item_rewards",
        elementType: QuestItemReward,
      },
    ],
  },

  // SMSG_QUEST_QUERY_RESPONSE (0x005D) - Quest information response
  {
    opcode: 0x005d,
    name: "SMSG_QUEST_QUERY_RESPONSE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "quest_id", type: "u32" },
      { kind: "primitive", name: "quest_method", type: "u32" },
      { kind: "primitive", name: "quest_level", type: "u32" },
      { kind: "primitive", name: "zone_or_sort", type: "u32" },
      { kind: "primitive", name: "quest_type", type: "u32" },
      { kind: "primitive", name: "reputation_objective_faction", type: "u32" },
      { kind: "primitive", name: "reputation_objective_value", type: "u32" },
      { kind: "primitive", name: "required_opposite_faction", type: "u32" },
      { kind: "primitive", name: "required_opposite_reputation_value", type: "u32" },
      { kind: "primitive", name: "next_quest_in_chain", type: "u32" },
      { kind: "primitive", name: "money_reward", type: "u32" },
      { kind: "primitive", name: "max_level_money_reward", type: "u32" },
      { kind: "primitive", name: "reward_spell", type: "u32" },
      { kind: "primitive", name: "source_item_id", type: "u32" },
      { kind: "primitive", name: "quest_flags", type: "u32" },
      // Fixed array of 4 rewards
      {
        kind: "array",
        name: "rewards",
        count: 4,
        elementType: QuestItemReward,
      },
      // Fixed array of 6 choice rewards
      {
        kind: "array",
        name: "choice_rewards",
        count: 6,
        elementType: QuestItemReward,
      },
      { kind: "primitive", name: "point_map_id", type: "u32" },
      Vector2d,
      { kind: "primitive", name: "point_opt", type: "u32" },
      { kind: "primitive", name: "title", type: "CString" },
      { kind: "primitive", name: "objective_text", type: "CString" },
      { kind: "primitive", name: "details", type: "CString" },
      { kind: "primitive", name: "end_text", type: "CString" },
      // Fixed array of 4 objectives
      {
        kind: "array",
        name: "objectives",
        count: 4,
        elementType: QuestObjective,
      },
      // Fixed array of 4 objective texts
      {
        kind: "array",
        name: "objective_texts",
        count: 4,
        elementType: { kind: "primitive", name: "text", type: "CString" },
      },
    ],
  },
];
