import { PacketDefinition } from "../../definitions";

// ============================================================
// Cinematic Packets
// ============================================================

export const cinematicDefinitions: PacketDefinition[] = [
  // SMSG_TRIGGER_CINEMATIC (0x00FA) - Server triggers cinematic sequence
  {
    opcode: 0x00fa,
    name: "SMSG_TRIGGER_CINEMATIC",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "cinematic_sequence_id", type: "u32" }],
  },

  // CMSG_NEXT_CINEMATIC_CAMERA (0x00FB) - Client ready for next cinematic camera
  {
    opcode: 0x00fb,
    name: "CMSG_NEXT_CINEMATIC_CAMERA",
    direction: "CMSG",
    fields: [],
  },

  // CMSG_COMPLETE_CINEMATIC (0x00FC) - Client finished watching cinematic
  {
    opcode: 0x00fc,
    name: "CMSG_COMPLETE_CINEMATIC",
    direction: "CMSG",
    fields: [],
  },
];
