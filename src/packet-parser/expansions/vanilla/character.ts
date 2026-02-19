import { PacketDefinition, FieldDef } from "../../definitions";
import {
  Race,
  Class,
  Gender,
  InventoryType,
  CharacterFlags,
} from "./shared";

// ============================================================
// SMSG_CHAR_ENUM (0x003B)
// ============================================================

const CharacterGear: FieldDef = {
  kind: "struct",
  name: "CharacterGear",
  fields: [
    { kind: "primitive", name: "equipment_display_id", type: "u32" },
    { kind: "enum", name: "inventory_type", enumDef: InventoryType },
  ],
};

const Character: FieldDef = {
  kind: "struct",
  name: "Character",
  fields: [
    { kind: "primitive", name: "guid", type: "Guid" },
    { kind: "primitive", name: "name", type: "CString" },
    { kind: "enum", name: "race", enumDef: Race },
    { kind: "enum", name: "class", enumDef: Class },
    { kind: "enum", name: "gender", enumDef: Gender },
    { kind: "primitive", name: "skin", type: "u8" },
    { kind: "primitive", name: "face", type: "u8" },
    { kind: "primitive", name: "hair_style", type: "u8" },
    { kind: "primitive", name: "hair_color", type: "u8" },
    { kind: "primitive", name: "facial_hair", type: "u8" },
    { kind: "primitive", name: "level", type: "u8" },
    { kind: "primitive", name: "area", type: "u32" },
    { kind: "primitive", name: "map", type: "u32" },
    { kind: "primitive", name: "position_x", type: "f32" },
    { kind: "primitive", name: "position_y", type: "f32" },
    { kind: "primitive", name: "position_z", type: "f32" },
    { kind: "primitive", name: "guild_id", type: "u32" },
    { kind: "flags", name: "flags", flagsDef: CharacterFlags },
    { kind: "primitive", name: "first_login", type: "bool" },
    { kind: "primitive", name: "pet_display_id", type: "u32" },
    { kind: "primitive", name: "pet_level", type: "u32" },
    { kind: "primitive", name: "pet_family", type: "u32" },
    {
      kind: "array",
      name: "equipment",
      elementType: CharacterGear,
      count: 19,
    },
    { kind: "primitive", name: "first_bag_display_id", type: "u32" },
    { kind: "primitive", name: "first_bag_inventory_type", type: "u8" },
  ],
};

const SMSG_CHAR_ENUM: PacketDefinition = {
  opcode: 0x003b,
  name: "SMSG_CHAR_ENUM",
  direction: "SMSG",
  fields: [
    { kind: "primitive", name: "amount_of_characters", type: "u8" },
    {
      kind: "array",
      name: "characters",
      elementType: Character,
      count: "amount_of_characters",
    },
  ],
};

export const characterDefinitions: PacketDefinition[] = [
  // SMSG_AUTH_CHALLENGE (0x01EC) - Server sends auth challenge
  {
    opcode: 0x01ec,
    name: "SMSG_AUTH_CHALLENGE",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "server_seed", type: "u32" }],
  },

  // CMSG_AUTH_SESSION (0x01ED) - Client responds to auth challenge
  {
    opcode: 0x01ed,
    name: "CMSG_AUTH_SESSION",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "build", type: "u32" },
      { kind: "primitive", name: "login_server_id", type: "u32" },
      { kind: "primitive", name: "account_name", type: "CString" },
      { kind: "primitive", name: "login_server_type", type: "u32" },
      { kind: "primitive", name: "client_seed", type: "u32" },
      { kind: "primitive", name: "region_id", type: "u32" },
      { kind: "primitive", name: "battleground_id", type: "u32" },
      { kind: "primitive", name: "realm_id", type: "u32" },
      { kind: "primitive", name: "dos_response", type: "u64" },
      {
        kind: "array",
        name: "client_proof",
        count: 20,
        elementType: { kind: "primitive", name: "byte", type: "u8" },
      },
      {
        kind: "array",
        name: "addon_info",
        count: 0,
        elementType: { kind: "primitive", name: "byte", type: "u8" },
      },
    ],
  },

  // SMSG_AUTH_RESPONSE (0x01EE) - Server responds to auth session
  {
    opcode: 0x01ee,
    name: "SMSG_AUTH_RESPONSE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "result", type: "u8" },
      { kind: "primitive", name: "billing_time", type: "u32" },
      { kind: "primitive", name: "billing_flags", type: "u8" },
      { kind: "primitive", name: "billing_rested", type: "u32" },
    ],
  },

  // CMSG_CHAR_ENUM (0x0037) - Client requests character list
  {
    opcode: 0x0037,
    name: "CMSG_CHAR_ENUM",
    direction: "CMSG",
    fields: [],
  },

  SMSG_CHAR_ENUM,

  // CMSG_CHAR_CREATE (0x0036) - Client requests to create character
  {
    opcode: 0x0036,
    name: "CMSG_CHAR_CREATE",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "name", type: "CString" },
      { kind: "enum", name: "race", enumDef: Race },
      { kind: "enum", name: "class", enumDef: Class },
      { kind: "enum", name: "gender", enumDef: Gender },
      { kind: "primitive", name: "skin_color", type: "u8" },
      { kind: "primitive", name: "face", type: "u8" },
      { kind: "primitive", name: "hair_style", type: "u8" },
      { kind: "primitive", name: "hair_color", type: "u8" },
      { kind: "primitive", name: "facial_hair", type: "u8" },
      { kind: "primitive", name: "outfit_id", type: "u8" },
    ],
  },

  // SMSG_CHAR_CREATE (0x003A) - Server responds to character creation
  {
    opcode: 0x003a,
    name: "SMSG_CHAR_CREATE",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "result", type: "u8" }],
  },
];
