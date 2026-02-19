import { PacketDefinition } from "../../definitions";
import {
  ChatType,
  Language,
  PlayerChatTag,
  ChatNotify,
  ServerMessageType,
} from "./shared";
import { BinaryReader } from "../../BinaryReader";
import { ParsedValue } from "../../types";

// ============================================================
// Chat and Channel System Packets
// ============================================================

// Custom parser for SizedCString (u32 length + string + null terminator)
function readSizedCString(reader: BinaryReader): ParsedValue {
  const length = reader.readU32();
  const str = reader.readCString();
  return {
    kind: "string",
    value: str,
  };
}

export const chatDefinitions: PacketDefinition[] = [
  // CMSG_MESSAGECHAT (0x0095) - Client sends chat message
  {
    opcode: 0x0095,
    name: "CMSG_MESSAGECHAT",
    direction: "CMSG",
    fields: [
      { kind: "enum", name: "chat_type", enumDef: ChatType },
      { kind: "enum", name: "language", enumDef: Language },
      {
        kind: "match",
        branches: [
          {
            condition: { kind: "equals", field: "chat_type", values: [6] }, // WHISPER
            fields: [
              { kind: "primitive", name: "target_player", type: "CString" },
            ],
          },
          {
            condition: { kind: "equals", field: "chat_type", values: [14] }, // CHANNEL
            fields: [{ kind: "primitive", name: "channel", type: "CString" }],
          },
        ],
      },
      { kind: "primitive", name: "message", type: "CString" },
    ],
  },

  // SMSG_MESSAGECHAT (0x0096) - Chat message from server
  {
    opcode: 0x0096,
    name: "SMSG_MESSAGECHAT",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "chat_type", enumDef: ChatType },
      { kind: "enum", name: "language", enumDef: Language },
      // Different fields based on chat_type
      {
        kind: "match",
        branches: [
          {
            condition: {
              kind: "equals",
              field: "chat_type",
              values: [11, 12, 13], // MONSTER_SAY, MONSTER_YELL, MONSTER_EMOTE
            },
            fields: [
              {
                kind: "custom",
                name: "monster_name",
                typeName: "SizedCString",
                read: readSizedCString,
              },
              { kind: "primitive", name: "monster", type: "Guid" },
            ],
          },
          {
            condition: {
              kind: "equals",
              field: "chat_type",
              values: [0, 1, 5], // SAY, PARTY, YELL
            },
            fields: [
              { kind: "primitive", name: "speech_bubble_credit", type: "Guid" },
              { kind: "primitive", name: "chat_credit", type: "Guid" },
            ],
          },
          {
            condition: {
              kind: "equals",
              field: "chat_type",
              values: [14], // CHANNEL
            },
            fields: [
              { kind: "primitive", name: "channel_name", type: "CString" },
              { kind: "primitive", name: "player_rank", type: "u32" },
              { kind: "primitive", name: "player", type: "Guid" },
            ],
          },
          {
            condition: {
              kind: "equals",
              field: "chat_type",
              values: [
                2, 3, 4, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                24,
              ], // All other chat types
            },
            fields: [{ kind: "primitive", name: "sender", type: "Guid" }],
          },
        ],
      },
      {
        kind: "custom",
        name: "message",
        typeName: "SizedCString",
        read: readSizedCString,
      },
      { kind: "enum", name: "tag", enumDef: PlayerChatTag },
    ],
  },

  // CMSG_JOIN_CHANNEL (0x0097) - Join a chat channel
  {
    opcode: 0x0097,
    name: "CMSG_JOIN_CHANNEL",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "channel_name", type: "CString" },
      { kind: "primitive", name: "channel_password", type: "CString" },
    ],
  },

  // SMSG_CHANNEL_NOTIFY (0x0099) - Channel status notification
  {
    opcode: 0x0099,
    name: "SMSG_CHANNEL_NOTIFY",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "notify_type", enumDef: ChatNotify },
      { kind: "primitive", name: "channel_name", type: "CString" },
    ],
  },

  // SMSG_SERVER_MESSAGE (0x0291) - Server system message (shutdown, restart, etc.)
  {
    opcode: 0x0291,
    name: "SMSG_SERVER_MESSAGE",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "message_type", enumDef: ServerMessageType },
      { kind: "primitive", name: "message", type: "CString" },
    ],
  },

  // SMSG_EMOTE (0x0103) - NPC/player emote animation
  {
    opcode: 0x0103,
    name: "SMSG_EMOTE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "emote", type: "u32" },
      { kind: "primitive", name: "guid", type: "Guid" },
    ],
  },
];
