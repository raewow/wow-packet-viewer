import { PacketDefinition } from "../../definitions";
import { Map, WeatherType, WeatherChangeType, WorldState } from "./shared";

// ============================================================
// World State and Environment Packets
// ============================================================

export const worldDefinitions: PacketDefinition[] = [
  // SMSG_INIT_WORLD_STATES (0x02C2) - Initialize world state values
  {
    opcode: 0x02c2,
    name: "SMSG_INIT_WORLD_STATES",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "map", enumDef: Map },
      { kind: "primitive", name: "area", type: "u32" },
      { kind: "primitive", name: "amount_of_states", type: "u16" },
      {
        kind: "array",
        name: "states",
        count: "amount_of_states",
        elementType: WorldState,
      },
    ],
  },

  // SMSG_WEATHER (0x02F4) - Weather changes
  {
    opcode: 0x02f4,
    name: "SMSG_WEATHER",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "weather_type", enumDef: WeatherType },
      { kind: "primitive", name: "grade", type: "f32" },
      { kind: "primitive", name: "sound_id", type: "u32" },
      { kind: "enum", name: "change", enumDef: WeatherChangeType },
    ],
  },

  // CMSG_ZONEUPDATE (0x01F4) - Client notifies server of zone change
  {
    opcode: 0x01f4,
    name: "CMSG_ZONEUPDATE",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "zone_id", type: "u32" }],
  },

  // SMSG_EXPLORATION_EXPERIENCE (0x01F8) - Exploration discovery XP reward
  {
    opcode: 0x01f8,
    name: "SMSG_EXPLORATION_EXPERIENCE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "area_id", type: "u32" },
      { kind: "primitive", name: "experience", type: "u32" },
    ],
  },
];
