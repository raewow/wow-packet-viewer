import { PacketDefinition } from "../../definitions";
import { GmTicketStatus, GmTicketType, GmTicketEscalationStatus } from "./shared";
import { MovementInfo } from "./shared";

// ============================================================
// Miscellaneous Packets (GM Tickets, Battleground, etc.)
// ============================================================

export const miscDefinitions: PacketDefinition[] = [
  // ========== GM Ticket System ==========

  // CMSG_GMTICKET_GETTICKET (0x0211) - Request GM ticket status
  {
    opcode: 0x0211,
    name: "CMSG_GMTICKET_GETTICKET",
    direction: "CMSG",
    fields: [],
  },

  // SMSG_GMTICKET_GETTICKET (0x0212) - GM ticket status response
  {
    opcode: 0x0212,
    name: "SMSG_GMTICKET_GETTICKET",
    direction: "SMSG",
    fields: [
      { kind: "enum", name: "status", enumDef: GmTicketStatus },
      {
        kind: "match",
        branches: [
          {
            condition: { kind: "equals", field: "status", values: [6] }, // HAS_TEXT
            fields: [
              { kind: "primitive", name: "text", type: "CString" },
              { kind: "enum", name: "ticket_type", enumDef: GmTicketType },
              {
                kind: "primitive",
                name: "days_since_ticket_creation",
                type: "f32",
              },
              {
                kind: "primitive",
                name: "days_since_oldest_ticket_creation",
                type: "f32",
              },
              {
                kind: "primitive",
                name: "days_since_last_updated",
                type: "f32",
              },
              {
                kind: "enum",
                name: "escalation_status",
                enumDef: GmTicketEscalationStatus,
              },
              { kind: "primitive", name: "read_by_gm", type: "u8" }, // Bool
            ],
          },
        ],
      },
    ],
  },

  // ========== Movement System ==========

  // CMSG_SET_ACTIVE_MOVER (0x026A) - Set active mover GUID
  {
    opcode: 0x026a,
    name: "CMSG_SET_ACTIVE_MOVER",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },

  // MSG_MOVE_FALL_LAND (0x00C9) - Player landed after falling
  {
    opcode: 0x00c9,
    name: "MSG_MOVE_FALL_LAND",
    direction: "CMSG",
    fields: [MovementInfo],
  },

  // ========== Battleground System ==========

  // CMSG_BATTLEFIELD_STATUS (0x02D3) - Request battleground status
  {
    opcode: 0x02d3,
    name: "CMSG_BATTLEFIELD_STATUS",
    direction: "CMSG",
    fields: [],
  },

  // CMSG_MEETINGSTONE_INFO (0x0296) - Request meeting stone information
  {
    opcode: 0x0296,
    name: "CMSG_MEETINGSTONE_INFO",
    direction: "CMSG",
    fields: [],
  },

  // ========== Combat System ==========

  // SMSG_CANCEL_COMBAT (0x014E) - Cancel combat state
  {
    opcode: 0x014e,
    name: "SMSG_CANCEL_COMBAT",
    direction: "SMSG",
    fields: [],
  },

  // CMSG_SETSHEATHED (0x01E0) - Client sets weapon sheath state
  {
    opcode: 0x01e0,
    name: "CMSG_SETSHEATHED",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "sheathed", type: "u32" }],
  },

  // ========== Selection System ==========

  // CMSG_SET_SELECTION (0x013D) - Client sets current target selection
  {
    opcode: 0x013d,
    name: "CMSG_SET_SELECTION",
    direction: "CMSG",
    fields: [{ kind: "primitive", name: "target", type: "Guid" }],
  },

  // ========== Trade System ==========

  // CMSG_CANCEL_TRADE (0x011C) - Client cancels active trade
  {
    opcode: 0x011c,
    name: "CMSG_CANCEL_TRADE",
    direction: "CMSG",
    fields: [],
  },

  // ========== Game Object System ==========

  // SMSG_DESTROY_OBJECT (0x00AA) - Remove object from game world
  {
    opcode: 0x00aa,
    name: "SMSG_DESTROY_OBJECT",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "guid", type: "Guid" }],
  },
];
