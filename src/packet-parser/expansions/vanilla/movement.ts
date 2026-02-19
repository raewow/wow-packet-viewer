import { PacketDefinition } from "../../definitions";
import {
  MovementInfo,
  Vector3d,
  MonsterMoveType,
  SplineFlag,
  MonsterMoveSplines,
} from "./shared";

// ============================================================
// MSG_MOVE_* Packet Definitions (Vanilla 1.12)
// ============================================================

// CMSG: client sends MovementInfo only
// SMSG: server relays PackedGuid + MovementInfo

function movementPacket(name: string, opcode: number): PacketDefinition[] {
  return [
    {
      opcode,
      name,
      direction: "CMSG",
      fields: [MovementInfo],
    },
    {
      opcode,
      name,
      direction: "SMSG",
      fields: [
        { kind: "primitive", name: "guid", type: "PackedGuid" },
        MovementInfo,
      ],
    },
  ];
}

export const movementDefinitions: PacketDefinition[] = [
  ...movementPacket("MSG_MOVE_START_FORWARD", 0x00b5),
  ...movementPacket("MSG_MOVE_START_BACKWARD", 0x00b6),
  ...movementPacket("MSG_MOVE_STOP", 0x00b7),
  ...movementPacket("MSG_MOVE_START_STRAFE_LEFT", 0x00b8),
  ...movementPacket("MSG_MOVE_START_STRAFE_RIGHT", 0x00b9),
  ...movementPacket("MSG_MOVE_STOP_STRAFE", 0x00ba),
  ...movementPacket("MSG_MOVE_JUMP", 0x00bb),
  ...movementPacket("MSG_MOVE_START_TURN_LEFT", 0x00bc),
  ...movementPacket("MSG_MOVE_START_TURN_RIGHT", 0x00bd),
  ...movementPacket("MSG_MOVE_STOP_TURN", 0x00be),
  ...movementPacket("MSG_MOVE_START_PITCH_UP", 0x00bf),
  ...movementPacket("MSG_MOVE_START_PITCH_DOWN", 0x00c0),
  ...movementPacket("MSG_MOVE_STOP_PITCH", 0x00c1),
  ...movementPacket("MSG_MOVE_SET_RUN_MODE", 0x00c2),
  ...movementPacket("MSG_MOVE_SET_WALK_MODE", 0x00c3),
  ...movementPacket("MSG_MOVE_FALL_LAND", 0x00c9),
  ...movementPacket("MSG_MOVE_START_SWIM", 0x00ca),
  ...movementPacket("MSG_MOVE_STOP_SWIM", 0x00cb),
  ...movementPacket("MSG_MOVE_SET_FACING", 0x00da),
  ...movementPacket("MSG_MOVE_SET_PITCH", 0x00db),
  ...movementPacket("MSG_MOVE_HEARTBEAT", 0x00ee),

  // SMSG_MONSTER_MOVE (0x00DD) - Server-controlled creature movement
  {
    opcode: 0x00dd,
    name: "SMSG_MONSTER_MOVE",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "PackedGuid" },
      Vector3d,
      { kind: "primitive", name: "spline_id", type: "u32" },
      { kind: "enum", name: "move_type", enumDef: MonsterMoveType },
      // if (move_type == FACING_TARGET)
      {
        kind: "match",
        branches: [
          {
            condition: { kind: "equals", field: "move_type", values: [3] }, // FACING_TARGET
            fields: [{ kind: "primitive", name: "target", type: "Guid" }],
          },
          {
            condition: { kind: "equals", field: "move_type", values: [4] }, // FACING_ANGLE
            fields: [{ kind: "primitive", name: "angle", type: "f32" }],
          },
          {
            condition: { kind: "equals", field: "move_type", values: [2] }, // FACING_SPOT
            fields: [Vector3d],
          },
        ],
      },
      { kind: "flags", name: "spline_flags", flagsDef: SplineFlag },
      { kind: "primitive", name: "duration", type: "u32" },
      MonsterMoveSplines,
    ],
  },

  // CMSG_MOVE_TIME_SKIPPED (0x02CE) - Client reports time skipped due to lag
  {
    opcode: 0x02ce,
    name: "CMSG_MOVE_TIME_SKIPPED",
    direction: "CMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "Guid" },
      { kind: "primitive", name: "lag", type: "u32" },
    ],
  },

  // SMSG_SPLINE_MOVE_SET_RUN_MODE (0x030D) - Sets entity to run mode
  {
    opcode: 0x030d,
    name: "SMSG_SPLINE_MOVE_SET_RUN_MODE",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "guid", type: "PackedGuid" }],
  },

  // SMSG_SPLINE_MOVE_SET_WALK_MODE (0x030E) - Sets entity to walk mode
  {
    opcode: 0x030e,
    name: "SMSG_SPLINE_MOVE_SET_WALK_MODE",
    direction: "SMSG",
    fields: [{ kind: "primitive", name: "guid", type: "PackedGuid" }],
  },

  // SMSG_SPLINE_SET_RUN_SPEED (0x02FE) - Sets entity run speed
  {
    opcode: 0x02fe,
    name: "SMSG_SPLINE_SET_RUN_SPEED",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "PackedGuid" },
      { kind: "primitive", name: "speed", type: "f32" },
    ],
  },

  // SMSG_SPLINE_SET_WALK_SPEED (0x0301) - Sets entity walk speed
  {
    opcode: 0x0301,
    name: "SMSG_SPLINE_SET_WALK_SPEED",
    direction: "SMSG",
    fields: [
      { kind: "primitive", name: "guid", type: "PackedGuid" },
      { kind: "primitive", name: "speed", type: "f32" },
    ],
  },
];
