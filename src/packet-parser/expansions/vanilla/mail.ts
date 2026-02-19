import { PacketDefinition } from "../../definitions";

// ============================================================
// Mail System Packets
// ============================================================

export const mailDefinitions: PacketDefinition[] = [
  // MSG_QUERY_NEXT_MAIL_TIME (0x0284) - Query/response for next mail arrival
  {
    opcode: 0x0284,
    name: "MSG_QUERY_NEXT_MAIL_TIME",
    direction: "CMSG",
    fields: [],
  },
  {
    opcode: 0x0284,
    name: "MSG_QUERY_NEXT_MAIL_TIME",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "timestamp", type: "u32" }],
  },
];
