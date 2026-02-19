import { PacketDefinition } from "../../definitions";
import { Race, Class, Gender, ItemStat, ItemDamageType, ItemSpells, Language } from "./shared";
import { BinaryReader } from "../../BinaryReader";
import { ParsedValue } from "../../types";

// ============================================================
// Queries - Name, Time, and Information Requests
// ============================================================

// Custom parser for item query response optional data
function readItemQueryData(reader: BinaryReader): ParsedValue {
  // Check if there's item data (if not, item doesn't exist)
  if (reader.remaining() === 0) {
    return { kind: "null", value: null };
  }

  const fields: Record<string, ParsedValue> = {};

  // Read all item fields
  fields.class_and_sub_class = { kind: "number", value: reader.readU32() };
  fields.name1 = { kind: "string", value: reader.readCString() };
  fields.name2 = { kind: "string", value: reader.readCString() };
  fields.name3 = { kind: "string", value: reader.readCString() };
  fields.name4 = { kind: "string", value: reader.readCString() };
  fields.display_id = { kind: "number", value: reader.readU32() };
  fields.quality = { kind: "number", value: reader.readU32() };
  fields.flags = { kind: "number", value: reader.readU32() };
  fields.buy_price = { kind: "number", value: reader.readU32() };
  fields.sell_price = { kind: "number", value: reader.readU32() };
  fields.inventory_type = { kind: "number", value: reader.readU32() };
  fields.allowed_class = { kind: "number", value: reader.readU32() };
  fields.allowed_race = { kind: "number", value: reader.readU32() };
  fields.item_level = { kind: "number", value: reader.readU32() };
  fields.required_level = { kind: "number", value: reader.readU32() };
  fields.required_skill = { kind: "number", value: reader.readU32() };
  fields.required_skill_rank = { kind: "number", value: reader.readU32() };
  fields.required_spell = { kind: "number", value: reader.readU32() };
  fields.required_honor_rank = { kind: "number", value: reader.readU32() };
  fields.required_city_rank = { kind: "number", value: reader.readU32() };
  fields.required_faction = { kind: "number", value: reader.readU32() };
  fields.required_faction_rank = { kind: "number", value: reader.readU32() };
  fields.max_count = { kind: "number", value: reader.readU32() };
  fields.stackable = { kind: "number", value: reader.readU32() };
  fields.container_slots = { kind: "number", value: reader.readU32() };

  // Read stats[10]
  const stats: ParsedValue[] = [];
  for (let i = 0; i < 10; i++) {
    stats.push({
      kind: "struct",
      value: {
        stat_type: { kind: "number", value: reader.readU32() },
        value: { kind: "number", value: reader.readI32() },
      },
    });
  }
  fields.stats = { kind: "array", value: stats };

  // Read damages[5]
  const damages: ParsedValue[] = [];
  for (let i = 0; i < 5; i++) {
    damages.push({
      kind: "struct",
      value: {
        damage_minimum: { kind: "number", value: reader.readF32() },
        damage_maximum: { kind: "number", value: reader.readF32() },
        school: { kind: "number", value: reader.readU32() },
      },
    });
  }
  fields.damages = { kind: "array", value: damages };

  // Read resistances
  fields.armor = { kind: "number", value: reader.readI32() };
  fields.holy_resistance = { kind: "number", value: reader.readI32() };
  fields.fire_resistance = { kind: "number", value: reader.readI32() };
  fields.nature_resistance = { kind: "number", value: reader.readI32() };
  fields.frost_resistance = { kind: "number", value: reader.readI32() };
  fields.shadow_resistance = { kind: "number", value: reader.readI32() };
  fields.arcane_resistance = { kind: "number", value: reader.readI32() };

  fields.delay = { kind: "number", value: reader.readU32() };
  fields.ammo_type = { kind: "number", value: reader.readU32() };
  fields.ranged_range_modification = { kind: "number", value: reader.readF32() };

  // Read spells[5]
  const spells: ParsedValue[] = [];
  for (let i = 0; i < 5; i++) {
    spells.push({
      kind: "struct",
      value: {
        spell: { kind: "number", value: reader.readU32() },
        spell_trigger: { kind: "number", value: reader.readU32() },
        spell_charges: { kind: "number", value: reader.readI32() },
        spell_cooldown: { kind: "number", value: reader.readI32() },
        spell_category: { kind: "number", value: reader.readU32() },
        spell_category_cooldown: { kind: "number", value: reader.readI32() },
      },
    });
  }
  fields.spells = { kind: "array", value: spells };

  fields.bonding = { kind: "number", value: reader.readU32() };
  fields.description = { kind: "string", value: reader.readCString() };
  fields.page_text = { kind: "number", value: reader.readU32() };
  fields.language = { kind: "number", value: reader.readU32() };
  fields.page_text_material = { kind: "number", value: reader.readU32() };
  fields.start_quest = { kind: "number", value: reader.readU32() };
  fields.lock_id = { kind: "number", value: reader.readU32() };
  fields.material = { kind: "number", value: reader.readU32() };
  fields.sheathe_type = { kind: "number", value: reader.readU32() };
  fields.random_property = { kind: "number", value: reader.readU32() };
  fields.block = { kind: "number", value: reader.readU32() };
  fields.item_set = { kind: "number", value: reader.readU32() };
  fields.max_durability = { kind: "number", value: reader.readU32() };
  fields.area = { kind: "number", value: reader.readU32() };
  fields.map = { kind: "number", value: reader.readU32() };
  fields.bag_family = { kind: "number", value: reader.readU32() };

  return { kind: "struct", value: fields };
}

export const queriesDefinitions: PacketDefinition[] = [
  // CMSG_NAME_QUERY (0x0050) - Request information about a player by GUID
  {
    opcode: 0x0050,
    name: "CMSG_NAME_QUERY",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // SMSG_NAME_QUERY_RESPONSE (0x0051) - Response with player information
  {
    opcode: 0x0051,
    name: "SMSG_NAME_QUERY_RESPONSE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "character_name", type: "CString" },
      { kind: "primitive", name: "realm_name", type: "CString" },
      { kind: "enum", name: "race", enumDef: Race },
      { kind: "enum", name: "gender", enumDef: Gender },
      { kind: "enum", name: "class", enumDef: Class },
    ],
  },

  // CMSG_QUERY_TIME (0x01CE) - Request server time
  {
    opcode: 0x01ce,
    name: "CMSG_QUERY_TIME",
    direction: "CMSG",
    fields: [],
  },

  // SMSG_QUERY_TIME_RESPONSE (0x01CF) - Response with server time
  {
    opcode: 0x01cf,
    name: "SMSG_QUERY_TIME_RESPONSE",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "timestamp", type: "u32" }],
  },

  // CMSG_QUESTGIVER_STATUS_QUERY (0x0182) - Query quest giver status
  {
    opcode: 0x0182,
    name: "CMSG_QUESTGIVER_STATUS_QUERY",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // SMSG_QUESTGIVER_STATUS (0x0183) - Quest giver status response
  {
    opcode: 0x0183,
    name: "SMSG_QUESTGIVER_STATUS",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "status", type: "u32" },
    ],
  },

  // CMSG_ITEM_QUERY_SINGLE (0x0056) - Client requests item information
  {
    opcode: 0x0056,
    name: "CMSG_ITEM_QUERY_SINGLE",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "item", type: "u32" },
      { kind: "primitive", name: "guid", type: "Guid" },
    ],
  },

  // SMSG_ITEM_QUERY_SINGLE_RESPONSE (0x0058) - Item information response
  {
    opcode: 0x0058,
    name: "SMSG_ITEM_QUERY_SINGLE_RESPONSE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "item", type: "u32" },
      {
        kind: "custom",
        name: "item_data",
        typeName: "ItemQueryData",
        read: readItemQueryData,
      },
    ],
  },
];
