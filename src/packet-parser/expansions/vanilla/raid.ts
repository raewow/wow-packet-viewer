import { PacketDefinition } from "../../definitions";
import { RaidInfo } from "./shared";

// ============================================================
// Raid and Instance System Packets
// ============================================================

export const raidDefinitions: PacketDefinition[] = [
  // CMSG_REQUEST_RAID_INFO (0x02CD) - Request raid lockout information
  {
    opcode: 0x02cd,
    name: "CMSG_REQUEST_RAID_INFO",
    direction: "CMSG",
    fields: [],
  },

  // SMSG_RAID_INSTANCE_INFO (0x02CC) - Raid lockout information
  {
    opcode: 0x02cc,
    name: "SMSG_RAID_INSTANCE_INFO",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "amount_of_raid_infos", type: "u32" },
      {
        kind: "array",
        name: "raid_infos",
        count: "amount_of_raid_infos",
        elementType: RaidInfo,
      },
    ],
  },
];
