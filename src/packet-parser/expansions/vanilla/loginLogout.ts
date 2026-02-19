import { PacketDefinition } from "../../definitions";
import { Map, Vector3d, LogoutResult, LogoutSpeed } from "./shared";
import { BinaryReader } from "../../BinaryReader";
import { ParsedValue } from "../../types";

// ============================================================
// Login/Logout Sequence Packets
// ============================================================

// Custom parser for compressed account data
function readCompressedData(reader: BinaryReader): ParsedValue {
  const remainingBytes = reader.remaining();
  const data: number[] = [];
  for (let i = 0; i < remainingBytes; i++) {
    data.push(reader.readU8());
  }
  return {
    kind: "blob",
    value: data,
  };
}

export const loginLogoutDefinitions: PacketDefinition[] = [
  // CMSG_LOGOUT_REQUEST (0x004B) - Client requests to log out
  {
    opcode: 0x004b,
    name: "CMSG_LOGOUT_REQUEST",
    direction: "CMSG",
    fields: [],
  },

  // SMSG_LOGOUT_COMPLETE (0x004D) - Server confirms logout complete
  {
    opcode: 0x004d,
    name: "SMSG_LOGOUT_COMPLETE",
    direction: "SMSG",
    fields: [],
  },

  // CMSG_PLAYER_LOGIN (0x003D) - Client requests to log into a character
  {
    opcode: 0x003d,
    name: "CMSG_PLAYER_LOGIN",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // SMSG_LOGIN_VERIFY_WORLD (0x0236) - Confirms successful login with starting position
  {
    opcode: 0x0236,
    name: "SMSG_LOGIN_VERIFY_WORLD",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "map", enumDef: Map },
      Vector3d,
      { kind: "primitive", name: "orientation", type: "f32" },
    ],
  },

  // SMSG_ACCOUNT_DATA_TIMES (0x0209) - Account data block timestamps
  {
    opcode: 0x0209,
    name: "SMSG_ACCOUNT_DATA_TIMES",
    direction: "SMSG",
    fields: [
      {
        kind: "array",
        name: "data",
        count: 32,
        elementType: { kind: "primitive", name: "value", type: "u32" },
      },
    ],
  },

  // CMSG_UPDATE_ACCOUNT_DATA (0x020B) - Client sends compressed account data
  {
    opcode: 0x020b,
    name: "CMSG_UPDATE_ACCOUNT_DATA",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "data_type", type: "u32" },
      {
        kind: "custom",
        name: "compressed_data",
        typeName: "CompressedBlob",
        read: readCompressedData,
      },
    ],
  },

  // SMSG_TUTORIAL_FLAGS (0x00FD) - Tutorial completion status
  {
    opcode: 0x00fd,
    name: "SMSG_TUTORIAL_FLAGS",
    direction: "SMSG",
    fields: [
      {
        kind: "array",
        name: "tutorial_data",
        count: 8,
        elementType: { kind: "primitive", name: "value", type: "u32" },
      },
    ],
  },

  // SMSG_ACTION_BUTTONS (0x0129) - Player action bar configuration
  {
    opcode: 0x0129,
    name: "SMSG_ACTION_BUTTONS",
    direction: "SMSG",
    fields: [
      {
        kind: "array",
        name: "data",
        count: 120,
        elementType: { kind: "primitive", name: "value", type: "u32" },
      },
    ],
  },

  // SMSG_LOGIN_SETTIMESPEED (0x0042) - Server time and speed
  {
    opcode: 0x0042,
    name: "SMSG_LOGIN_SETTIMESPEED",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "timestamp", type: "u32" },
      { kind: "primitive", name: "speed", type: "f32" },
    ],
  },

  // SMSG_BINDPOINTUPDATE (0x0155) - Updates player's hearthstone location
  {
    opcode: 0x0155,
    name: "SMSG_BINDPOINTUPDATE",
    direction: "SMSG",
    fields: [
      Vector3d,
      { kind: "enum", name: "map", enumDef: Map },
      { kind: "primitive", name: "area", type: "u32" },
    ],
  },

  // SMSG_SET_REST_START (0x021E) - Start of rest state
  {
    opcode: 0x021e,
    name: "SMSG_SET_REST_START",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "unknown1", type: "u32" }],
  },

  // SMSG_LOGOUT_RESPONSE (0x004C) - Server response to logout request
  {
    opcode: 0x004c,
    name: "SMSG_LOGOUT_RESPONSE",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "result", enumDef: LogoutResult },
      { kind: "enum", name: "speed", enumDef: LogoutSpeed },
    ],
  },

  // CMSG_PING (0x01DC) - Client ping to server
  {
    opcode: 0x01dc,
    name: "CMSG_PING",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "sequence_id", type: "u32" },
      { kind: "primitive", name: "round_time_in_ms", type: "u32" },
    ],
  },

  // SMSG_ADDON_INFO (0x02EF) - Addon information response
  {
    opcode: 0x02ef,
    name: "SMSG_ADDON_INFO",
    direction: "SMSG",
    fields: [
      {
        kind: "custom",
        name: "addon_data",
        typeName: "AddonData",
        read: readCompressedData,
      },
    ],
  },

  // CMSG_TUTORIAL_CLEAR (0x00FF) - Clear all tutorial flags
  {
    opcode: 0x00ff,
    name: "CMSG_TUTORIAL_CLEAR",
    direction: "CMSG",
    fields: [],
  },

  // CMSG_SET_ACTIONBAR_TOGGLES (0x02BF) - Set action bar visibility
  {
    opcode: 0x02bf,
    name: "CMSG_SET_ACTIONBAR_TOGGLES",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "action_bar", type: "u8" }],
  },
];
