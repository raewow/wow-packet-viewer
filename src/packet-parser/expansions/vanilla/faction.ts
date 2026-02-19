import { PacketDefinition } from "../../definitions";
import { FactionInitializer, FactionStanding } from "./shared";

// ============================================================
// Faction and Reputation System Packets
// ============================================================

export const factionDefinitions: PacketDefinition[] = [
  // SMSG_INITIALIZE_FACTIONS (0x0122) - Initialize faction standings
  {
    opcode: 0x0122,
    name: "SMSG_INITIALIZE_FACTIONS",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "amount_of_factions", type: "u32" },
      {
        kind: "array",
        name: "factions",
        count: "amount_of_factions",
        elementType: FactionInitializer,
      },
    ],
  },

  // SMSG_SET_FACTION_STANDING (0x0124) - Update faction standings
  {
    opcode: 0x0124,
    name: "SMSG_SET_FACTION_STANDING",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "amount_of_faction_standings", type: "u32" },
      {
        kind: "array",
        name: "faction_standings",
        count: "amount_of_faction_standings",
        elementType: FactionStanding,
      },
    ],
  },
];
