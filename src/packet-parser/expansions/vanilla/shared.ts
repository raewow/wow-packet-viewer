import { EnumDef, FlagsDef, FieldDef } from "../../definitions";

// ============================================================
// Enums
// ============================================================

export const Race: EnumDef = {
  type: "u8",
  values: {
    1: "Human",
    2: "Orc",
    3: "Dwarf",
    4: "NightElf",
    5: "Undead",
    6: "Tauren",
    7: "Gnome",
    8: "Troll",
  },
};

export const Class: EnumDef = {
  type: "u8",
  values: {
    1: "Warrior",
    2: "Paladin",
    3: "Hunter",
    4: "Rogue",
    5: "Priest",
    7: "Shaman",
    8: "Mage",
    9: "Warlock",
    11: "Druid",
  },
};

export const Gender: EnumDef = {
  type: "u8",
  values: { 0: "Male", 1: "Female" },
};

export const InventoryType: EnumDef = {
  type: "u8",
  values: {
    0: "NonEquip",
    1: "Head",
    2: "Neck",
    3: "Shoulders",
    4: "Body",
    5: "Chest",
    6: "Waist",
    7: "Legs",
    8: "Feet",
    9: "Wrists",
    10: "Hands",
    11: "Finger",
    12: "Trinket",
    13: "Weapon",
    14: "Shield",
    15: "Ranged",
    16: "Cloak",
    17: "TwoHandWeapon",
    18: "Bag",
    19: "Tabard",
    20: "Robe",
    21: "MainHand",
    22: "OffHand",
    23: "Holdable",
    24: "Ammo",
    25: "Thrown",
    26: "RangedRight",
  },
};

export const UpdateType: EnumDef = {
  type: "u8",
  values: {
    0: "VALUES",
    1: "MOVEMENT",
    2: "CREATE_OBJECT",
    3: "CREATE_OBJECT2",
    4: "OUT_OF_RANGE_OBJECTS",
    5: "NEAR_OBJECTS",
  },
};

export const ObjectType: EnumDef = {
  type: "u8",
  values: {
    0: "OBJECT",
    1: "ITEM",
    2: "CONTAINER",
    3: "UNIT",
    4: "PLAYER",
    5: "GAME_OBJECT",
    6: "DYNAMIC_OBJECT",
    7: "CORPSE",
  },
};

export const FriendStatus: EnumDef = {
  type: "u8",
  values: {
    0: "OFFLINE",
    1: "ONLINE",
    2: "AFK",
    3: "UNKNOWN3",
    4: "DND",
  },
};

export const WeatherType: EnumDef = {
  type: "u32",
  values: {
    0: "FINE",
    1: "RAIN",
    2: "SNOW",
    3: "STORM",
  },
};

export const WeatherChangeType: EnumDef = {
  type: "u8",
  values: {
    0: "SMOOTH",
    1: "INSTANT",
  },
};

export const ChatNotify: EnumDef = {
  type: "u8",
  values: {
    0x00: "JOINED_NOTICE",
    0x01: "LEFT_NOTICE",
    0x02: "YOU_JOINED_NOTICE",
    0x03: "YOU_LEFT_NOTICE",
    0x04: "WRONG_PASSWORD_NOTICE",
    0x05: "NOT_MEMBER_NOTICE",
    0x06: "NOT_MODERATOR_NOTICE",
    0x07: "PASSWORD_CHANGED_NOTICE",
    0x08: "OWNER_CHANGED_NOTICE",
    0x09: "PLAYER_NOT_FOUND_NOTICE",
    0x0a: "NOT_OWNER_NOTICE",
    0x0b: "CHANNEL_OWNER_NOTICE",
    0x0c: "MODE_CHANGE_NOTICE",
    0x0d: "ANNOUNCEMENTS_ON_NOTICE",
    0x0e: "ANNOUNCEMENTS_OFF_NOTICE",
    0x0f: "MODERATION_ON_NOTICE",
    0x10: "MODERATION_OFF_NOTICE",
    0x11: "MUTED_NOTICE",
    0x12: "PLAYER_KICKED_NOTICE",
    0x13: "BANNED_NOTICE",
    0x14: "PLAYER_BANNED_NOTICE",
    0x15: "PLAYER_UNBANNED_NOTICE",
    0x16: "PLAYER_NOT_BANNED_NOTICE",
    0x17: "PLAYER_ALREADY_MEMBER_NOTICE",
    0x18: "INVITE_NOTICE",
    0x19: "INVITE_WRONG_FACTION_NOTICE",
    0x1a: "WRONG_FACTION_NOTICE",
    0x1b: "INVALID_NAME_NOTICE",
    0x1c: "NOT_MODERATED_NOTICE",
    0x1d: "PLAYER_INVITED_NOTICE",
    0x1e: "PLAYER_INVITE_BANNED_NOTICE",
    0x1f: "THROTTLED_NOTICE",
  },
};

export const PlayerChatTag: EnumDef = {
  type: "u8",
  values: {
    0: "NONE",
    1: "AFK",
    2: "DND",
    3: "GM",
  },
};

export const GmTicketStatus: EnumDef = {
  type: "u32",
  values: {
    0: "NO_TICKET",
    6: "HAS_TEXT",
  },
};

export const GmTicketType: EnumDef = {
  type: "u8",
  values: {
    1: "STUCK",
    2: "BEHAVIOR_HARASSMENT",
    3: "GUILD",
    4: "ITEM",
    5: "ENVIRONMENTAL",
    6: "CHARACTER",
    7: "TRADE",
    8: "URGENT",
    9: "BEHAVIOR_NAMING",
  },
};

export const GmTicketEscalationStatus: EnumDef = {
  type: "u8",
  values: {
    0: "NOT_ASSIGNED",
    1: "ASSIGNED",
    2: "ESCALATED",
  },
};

export const AccountDataType: EnumDef = {
  type: "u8",
  values: {
    0: "GLOBAL_CONFIG_CACHE",
    1: "PER_CHARACTER_CONFIG_CACHE",
    2: "GLOBAL_BINDINGS_CACHE",
    3: "PER_CHARACTER_BINDINGS_CACHE",
    4: "GLOBAL_MACROS_CACHE",
    5: "PER_CHARACTER_MACROS_CACHE",
    6: "PER_CHARACTER_LAYOUT_CACHE",
    7: "PER_CHARACTER_CHAT_CACHE",
  },
};

export const Map: EnumDef = {
  type: "u32",
  values: {
    0: "EASTERN_KINGDOMS",
    1: "KALIMDOR",
    30: "ALTERAC_VALLEY",
    33: "SHADOWFANG_KEEP",
    34: "STORMWIND_STOCKADE",
    36: "DEADMINES",
    43: "WAILING_CAVERNS",
    47: "RAZORFEN_KRAUL",
    48: "BLACKFATHOM_DEEPS",
    70: "ULDAMAN",
    90: "GNOMEREGAN",
    109: "SUNKEN_TEMPLE",
    129: "RAZORFEN_DOWNS",
    189: "SCARLET_MONASTERY",
    209: "ZUL_FARRAK",
    229: "BLACKROCK_SPIRE",
    230: "BLACKROCK_DEPTHS",
    249: "ONYXIA_LAIR",
    269: "OPENING_OF_THE_DARK_PORTAL",
    289: "SCHOLOMANCE",
    309: "ZUL_GURUB",
    329: "STRATHOLME",
    349: "MARAUDON",
    389: "RAGEFIRE_CHASM",
    409: "MOLTEN_CORE",
    429: "DIRE_MAUL",
    469: "BLACKWING_LAIR",
    489: "WARSONG_GULCH",
    509: "RUINS_OF_AHN_QIRAJ",
    529: "ARATHI_BASIN",
    531: "TEMPLE_OF_AHN_QIRAJ",
  },
};

export const ChatType: EnumDef = {
  type: "u8",
  values: {
    0: "SAY",
    1: "PARTY",
    2: "RAID",
    3: "GUILD",
    4: "OFFICER",
    5: "YELL",
    6: "WHISPER",
    7: "WHISPER_INFORM",
    8: "EMOTE",
    9: "TEXT_EMOTE",
    10: "SYSTEM",
    11: "MONSTER_SAY",
    12: "MONSTER_YELL",
    13: "MONSTER_EMOTE",
    14: "CHANNEL",
    15: "CHANNEL_JOIN",
    16: "CHANNEL_LEAVE",
    17: "CHANNEL_LIST",
    18: "CHANNEL_NOTICE",
    19: "CHANNEL_NOTICE_USER",
    20: "AFK",
    21: "DND",
    22: "IGNORED",
    23: "SKILL",
    24: "LOOT",
  },
};

export const Language: EnumDef = {
  type: "u32",
  values: {
    0: "UNIVERSAL",
    1: "ORCISH",
    2: "DARNASSIAN",
    3: "TAURAHE",
    6: "DWARVISH",
    7: "COMMON",
    8: "DEMONIC",
    9: "TITAN",
    10: "THALASSIAN",
    11: "DRACONIC",
    12: "KALIMAG",
    13: "GNOMISH",
    14: "TROLL",
    33: "GUTTERSPEAK",
  },
};

export const ServerMessageType: EnumDef = {
  type: "u32",
  values: {
    1: "SHUTDOWN_TIME",
    2: "RESTART_TIME",
    3: "CUSTOM",
    4: "SHUTDOWN_CANCELLED",
    5: "RESTART_CANCELLED",
  },
};

export const LogoutResult: EnumDef = {
  type: "u32",
  values: {
    0: "SUCCESS",
    1: "FAILURE_IN_COMBAT",
    2: "FAILURE_FROZEN_BY_GM",
    3: "FAILURE_JUMPING_OR_FALLING",
  },
};

export const LogoutSpeed: EnumDef = {
  type: "u8",
  values: {
    0: "DELAYED",
    1: "INSTANT",
  },
};

export const ItemClass: EnumDef = {
  type: "u8",
  values: {
    0: "CONSUMABLE",
    1: "CONTAINER",
    2: "WEAPON",
    3: "GEM",
    4: "ARMOR",
    5: "REAGENT",
    6: "PROJECTILE",
    7: "TRADE_GOODS",
    8: "GENERIC",
    9: "RECIPE",
    10: "MONEY",
    11: "QUIVER",
    12: "QUEST",
    13: "KEY",
    14: "PERMANENT",
    15: "MISC",
  },
};

export const Power: EnumDef = {
  type: "u32",
  values: {
    0: "MANA",
    1: "RAGE",
    2: "FOCUS",
    3: "ENERGY",
    4: "HAPPINESS",
  },
};

export const SpellSchool: EnumDef = {
  type: "u8",
  values: {
    0: "NORMAL",
    1: "HOLY",
    2: "FIRE",
    3: "NATURE",
    4: "FROST",
    5: "SHADOW",
    6: "ARCANE",
  },
};

export const SpellMissInfo: EnumDef = {
  type: "u8",
  values: {
    0: "NONE",
    1: "MISS",
    2: "RESIST",
    3: "DODGE",
    4: "PARRY",
    5: "BLOCK",
    6: "EVADE",
    7: "IMMUNE",
    8: "IMMUNE2",
    9: "DEFLECT",
    10: "ABSORB",
    11: "REFLECT",
  },
};

export const DamageType: EnumDef = {
  type: "u8",
  values: {
    0: "DROWNING",
    1: "FALLING",
    2: "FIRE",
    3: "LAVA",
    4: "SLIME",
    5: "EXHAUSTION",
  },
};

// SpellEffect enum - used in SMSG_SPELLLOGEXECUTE
export const SpellEffect: EnumDef = {
  type: "u32",
  values: {
    0: "NONE",
    1: "INSTAKILL",
    2: "SCHOOL_DAMAGE",
    3: "DUMMY",
    8: "POWER_DRAIN",
    10: "HEAL",
    19: "ADD_EXTRA_ATTACKS",
    24: "CREATE_ITEM",
    30: "ENERGIZE",
    33: "OPEN_LOCK",
    38: "DISPEL",
    50: "TRANS_DOOR",
    63: "THREAT",
    68: "INTERRUPT_CAST",
    69: "DISTRACT",
    79: "SANCTUARY",
    85: "SUMMON_PLAYER",
    87: "SUMMON_TOTEM_SLOT1",
    88: "SUMMON_TOTEM_SLOT2",
    89: "SUMMON_TOTEM_SLOT3",
    90: "SUMMON_TOTEM_SLOT4",
    91: "THREAT_ALL",
    101: "FEED_PET",
    102: "DISMISS_PET",
    104: "SUMMON_OBJECT_SLOT1",
    105: "SUMMON_OBJECT_SLOT2",
    106: "SUMMON_OBJECT_SLOT3",
    107: "SUMMON_OBJECT_SLOT4",
    108: "DISPEL_MECHANIC",
    111: "DURABILITY_DAMAGE",
    113: "RESURRECT_NEW",
    114: "ATTACK_ME",
    116: "SKIN_PLAYER_CORPSE",
    125: "MODIFY_THREAT_PERCENT",
    126: "UNKNOWN126",
    28: "SUMMON",
    56: "SUMMON_PET",
    41: "SUMMON_WILD",
    42: "SUMMON_GUARDIAN",
    73: "SUMMON_POSSESSED",
    74: "SUMMON_TOTEM",
    76: "SUMMON_OBJECT_WILD",
    81: "CREATE_HOUSE",
    83: "DUEL",
    93: "SUMMON_PHANTASM",
    97: "SUMMON_CRITTER",
    112: "SUMMON_DEMON",
    18: "RESURRECT",
    59: "OPEN_LOCK_ITEM",
    67: "HEAL_MAX_HEALTH",
  },
};

// AuraType enum - used in SMSG_PERIODICAURALOG
export const AuraType: EnumDef = {
  type: "u32",
  values: {
    0: "NONE",
    3: "PERIODIC_DAMAGE",
    8: "PERIODIC_HEAL",
    10: "MOD_THREAT",
    11: "MOD_TAUNT",
    20: "OBS_MOD_HEALTH",
    21: "OBS_MOD_MANA",
    23: "PERIODIC_TRIGGER_SPELL",
    24: "PERIODIC_ENERGIZE",
    64: "PERIODIC_MANA_LEECH",
    89: "PERIODIC_DAMAGE_PERCENT",
    103: "MOD_TOTAL_THREAT",
  },
};

export const MonsterMoveType: EnumDef = {
  type: "u8",
  values: {
    0: "NORMAL",
    1: "STOP",
    2: "FACING_SPOT",
    3: "FACING_TARGET",
    4: "FACING_ANGLE",
  },
};

// ============================================================
// Flags
// ============================================================

export const CharacterFlags: FlagsDef = {
  type: "u32",
  flags: [
    { name: "LOCKED_FOR_TRANSFER", value: 0x04 },
    { name: "HIDE_HELM", value: 0x0400 },
    { name: "HIDE_CLOAK", value: 0x0800 },
    { name: "GHOST", value: 0x2000 },
    { name: "RENAME", value: 0x4000 },
  ],
};

export const UpdateFlag: FlagsDef = {
  type: "u8",
  flags: [
    { name: "SELF", value: 0x01 },
    { name: "TRANSPORT", value: 0x02 },
    { name: "MELEE_ATTACKING", value: 0x04 },
    { name: "HIGH_GUID", value: 0x08 },
    { name: "ALL", value: 0x10 },
    { name: "LIVING", value: 0x20 },
    { name: "HAS_POSITION", value: 0x40 },
  ],
};

export const MovementFlags: FlagsDef = {
  type: "u32",
  flags: [
    { name: "FORWARD", value: 0x00000001 },
    { name: "BACKWARD", value: 0x00000002 },
    { name: "STRAFE_LEFT", value: 0x00000004 },
    { name: "STRAFE_RIGHT", value: 0x00000008 },
    { name: "TURN_LEFT", value: 0x00000010 },
    { name: "TURN_RIGHT", value: 0x00000020 },
    { name: "PITCH_UP", value: 0x00000040 },
    { name: "PITCH_DOWN", value: 0x00000080 },
    { name: "WALK_MODE", value: 0x00000100 },
    { name: "LEVITATING", value: 0x00000400 },
    { name: "JUMPING", value: 0x00002000 },
    { name: "FALLING", value: 0x00008000 },
    { name: "SWIMMING", value: 0x00200000 },
    { name: "ON_TRANSPORT", value: 0x02000000 },
    { name: "SPLINE_ELEVATION", value: 0x04000000 },
    { name: "SPLINE_ENABLED", value: 0x08000000 },
    { name: "WATERWALKING", value: 0x10000000 },
    { name: "SAFE_FALL", value: 0x20000000 },
    { name: "HOVER", value: 0x40000000 },
  ],
};

export const SplineFlag: FlagsDef = {
  type: "u32",
  flags: [
    { name: "DONE", value: 0x00000001 },
    { name: "FALLING", value: 0x00000002 },
    { name: "RUN_MODE", value: 0x00000100 },
    { name: "FLYING", value: 0x00000200 },
    { name: "NO_SPLINE", value: 0x00000400 },
    { name: "FINAL_POINT", value: 0x00010000 },
    { name: "FINAL_TARGET", value: 0x00020000 },
    { name: "FINAL_ANGLE", value: 0x00040000 },
    { name: "CYCLIC", value: 0x00100000 },
    { name: "ENTER_CYCLE", value: 0x00200000 },
    { name: "FROZEN", value: 0x00400000 },
  ],
};

export const FactionFlag: FlagsDef = {
  type: "u8",
  flags: [
    { name: "VISIBLE", value: 0x01 },
    { name: "AT_WAR", value: 0x02 },
    { name: "HIDDEN", value: 0x04 },
    { name: "INVISIBLE_FORCED", value: 0x08 },
    { name: "PEACE_FORCED", value: 0x10 },
    { name: "INACTIVE", value: 0x20 },
    { name: "RIVAL", value: 0x40 },
  ],
};

export const SpellCastTargetFlags: FlagsDef = {
  type: "u16",
  flags: [
    { name: "SELF", value: 0x0000 },
    { name: "UNIT", value: 0x0002 },
    { name: "ITEM", value: 0x0010 },
    { name: "SOURCE_LOCATION", value: 0x0020 },
    { name: "DEST_LOCATION", value: 0x0040 },
    { name: "OBJECT_UNK", value: 0x0080 },
    { name: "UNIT_UNK", value: 0x0100 },
    { name: "PVP_CORPSE", value: 0x0200 },
    { name: "UNIT_CORPSE", value: 0x0400 },
    { name: "GAMEOBJECT", value: 0x0800 },
    { name: "TRADE_ITEM", value: 0x1000 },
    { name: "STRING", value: 0x2000 },
    { name: "UNK1", value: 0x4000 },
    { name: "CORPSE", value: 0x8000 },
  ],
};

export const CastFlags: FlagsDef = {
  type: "u16",
  flags: [
    { name: "NONE", value: 0x0000 },
    { name: "HIDDEN_COMBATLOG", value: 0x0001 },
    { name: "UNKNOWN2", value: 0x0002 },
    { name: "UNKNOWN3", value: 0x0004 },
    { name: "UNKNOWN4", value: 0x0008 },
    { name: "UNKNOWN5", value: 0x0010 },
    { name: "AMMO", value: 0x0020 },
    { name: "UNKNOWN7", value: 0x0040 },
    { name: "UNKNOWN8", value: 0x0080 },
    { name: "UNKNOWN9", value: 0x0100 },
  ],
};

export const HitInfo: FlagsDef = {
  type: "u32",
  flags: [
    { name: "NORMALSWING", value: 0x00000000 },
    { name: "UNK1", value: 0x00000001 },
    { name: "NORMALSWING2", value: 0x00000002 },
    { name: "LEFTSWING", value: 0x00000004 },
    { name: "UNK2", value: 0x00000008 },
    { name: "MISS", value: 0x00000010 },
    { name: "ABSORB", value: 0x00000020 },
    { name: "RESIST", value: 0x00000040 },
    { name: "CRITICAL_HIT", value: 0x00000080 },
    { name: "UNK3", value: 0x00000100 },
    { name: "UNK4", value: 0x00002000 },
    { name: "GLANCING", value: 0x00004000 },
    { name: "CRUSHING", value: 0x00008000 },
    { name: "NO_ANIMATION", value: 0x00010000 },
    { name: "UNK5", value: 0x00020000 },
    { name: "BLOCK", value: 0x00080000 },
  ],
};

// ============================================================
// Shared Structs
// ============================================================

export const Vector3d: FieldDef = {
  kind: "struct",
  name: "Vector3d",
  fields: [
    { kind: "primitive", name: "x", type: "f32" },
    { kind: "primitive", name: "y", type: "f32" },
    { kind: "primitive", name: "z", type: "f32" },
  ],
};

export const MovementInfo: FieldDef = {
  kind: "struct",
  name: "MovementInfo",
  fields: [
    { kind: "flags", name: "flags", flagsDef: MovementFlags },
    { kind: "primitive", name: "timestamp", type: "u32" },
    {
      kind: "struct",
      name: "position",
      fields: [
        { kind: "primitive", name: "x", type: "f32" },
        { kind: "primitive", name: "y", type: "f32" },
        { kind: "primitive", name: "z", type: "f32" },
      ],
    },
    { kind: "primitive", name: "orientation", type: "f32" },

    // if (flags & ON_TRANSPORT)
    {
      kind: "if_flag",
      field: "flags",
      flag: 0x02000000,
      fields: [
        { kind: "primitive", name: "transport_guid", type: "PackedGuid" },
        {
          kind: "struct",
          name: "transport_position",
          fields: [
            { kind: "primitive", name: "x", type: "f32" },
            { kind: "primitive", name: "y", type: "f32" },
            { kind: "primitive", name: "z", type: "f32" },
          ],
        },
        { kind: "primitive", name: "transport_orientation", type: "f32" },
        { kind: "primitive", name: "transport_timestamp", type: "u32" },
      ],
    },

    // if (flags & SWIMMING)
    {
      kind: "if_flag",
      field: "flags",
      flag: 0x00200000,
      fields: [{ kind: "primitive", name: "pitch", type: "f32" }],
    },

    { kind: "primitive", name: "fall_time", type: "f32" },

    // if (flags & JUMPING)
    {
      kind: "if_flag",
      field: "flags",
      flag: 0x00002000,
      fields: [
        { kind: "primitive", name: "z_speed", type: "f32" },
        { kind: "primitive", name: "cos_angle", type: "f32" },
        { kind: "primitive", name: "sin_angle", type: "f32" },
        { kind: "primitive", name: "xy_speed", type: "f32" },
      ],
    },

    // if (flags & SPLINE_ELEVATION)
    {
      kind: "if_flag",
      field: "flags",
      flag: 0x04000000,
      fields: [{ kind: "primitive", name: "spline_elevation", type: "f32" }],
    },
  ],
};

export const Friend: FieldDef = {
  kind: "struct",
  name: "Friend",
  fields: [
    { kind: "primitive", name: "guid", type: "Guid" },
    { kind: "enum", name: "status", enumDef: FriendStatus },
    // if (status != OFFLINE)
    {
      kind: "match",
      branches: [
        {
          condition: { kind: "equals", field: "status", values: [1, 2, 3, 4] }, // ONLINE, AFK, UNKNOWN3, DND
          fields: [
            { kind: "primitive", name: "area", type: "u32" },
            { kind: "primitive", name: "level", type: "u32" },
            { kind: "enum", name: "class", enumDef: Class },
          ],
        },
      ],
    },
  ],
};

export const InitialSpell: FieldDef = {
  kind: "struct",
  name: "InitialSpell",
  fields: [
    { kind: "primitive", name: "spell_id", type: "u16" },
    { kind: "primitive", name: "unknown1", type: "u16" },
  ],
};

export const CooldownSpell: FieldDef = {
  kind: "struct",
  name: "CooldownSpell",
  fields: [
    { kind: "primitive", name: "spell_id", type: "u16" },
    { kind: "primitive", name: "item_id", type: "u16" },
    { kind: "primitive", name: "spell_category", type: "u16" },
    { kind: "primitive", name: "cooldown", type: "u32" }, // Milliseconds
    { kind: "primitive", name: "category_cooldown", type: "u32" }, // Milliseconds
  ],
};

export const RaidInfo: FieldDef = {
  kind: "struct",
  name: "RaidInfo",
  fields: [
    { kind: "enum", name: "map", enumDef: Map },
    { kind: "primitive", name: "reset_time", type: "u32" },
    { kind: "primitive", name: "instance_id", type: "u32" },
  ],
};

export const FactionInitializer: FieldDef = {
  kind: "struct",
  name: "FactionInitializer",
  fields: [
    { kind: "flags", name: "flag", flagsDef: FactionFlag },
    { kind: "primitive", name: "standing", type: "u32" },
  ],
};

export const WorldState: FieldDef = {
  kind: "struct",
  name: "WorldState",
  fields: [
    { kind: "primitive", name: "state", type: "u32" },
    { kind: "primitive", name: "value", type: "u32" },
  ],
};

export const SpellCastTargets: FieldDef = {
  kind: "struct",
  name: "SpellCastTargets",
  fields: [
    { kind: "flags", name: "target_flags", flagsDef: SpellCastTargetFlags },
    // if (target_flags & UNIT)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x0002,
      fields: [{ kind: "primitive", name: "unit_target", type: "PackedGuid" }],
    },
    // if (target_flags & GAMEOBJECT)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x0800,
      fields: [{ kind: "primitive", name: "gameobject", type: "PackedGuid" }],
    },
    // if (target_flags & OBJECT_UNK)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x0080,
      fields: [{ kind: "primitive", name: "object_unk", type: "PackedGuid" }],
    },
    // if (target_flags & ITEM)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x0010,
      fields: [{ kind: "primitive", name: "item", type: "PackedGuid" }],
    },
    // if (target_flags & TRADE_ITEM)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x1000,
      fields: [{ kind: "primitive", name: "trade_item", type: "PackedGuid" }],
    },
    // if (target_flags & SOURCE_LOCATION)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x0020,
      fields: [Vector3d],
    },
    // if (target_flags & DEST_LOCATION)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x0040,
      fields: [
        {
          kind: "struct",
          name: "destination",
          fields: [
            { kind: "primitive", name: "x", type: "f32" },
            { kind: "primitive", name: "y", type: "f32" },
            { kind: "primitive", name: "z", type: "f32" },
          ],
        },
      ],
    },
    // if (target_flags & STRING)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x2000,
      fields: [{ kind: "primitive", name: "target_string", type: "CString" }],
    },
    // if (target_flags & CORPSE)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x8000,
      fields: [{ kind: "primitive", name: "corpse", type: "PackedGuid" }],
    },
    // if (target_flags & PVP_CORPSE)
    {
      kind: "if_flag",
      field: "target_flags",
      flag: 0x0200,
      fields: [{ kind: "primitive", name: "pvp_corpse", type: "PackedGuid" }],
    },
  ],
};

export const SpellMiss: FieldDef = {
  kind: "struct",
  name: "SpellMiss",
  fields: [
    { kind: "primitive", name: "target", type: "Guid" },
    { kind: "enum", name: "miss_info", enumDef: SpellMissInfo },
  ],
};

export const SpellLogMiss: FieldDef = {
  kind: "struct",
  name: "SpellLogMiss",
  fields: [
    { kind: "primitive", name: "target", type: "Guid" },
    { kind: "enum", name: "miss_info", enumDef: SpellMissInfo },
  ],
};

export const DamageInfo: FieldDef = {
  kind: "struct",
  name: "DamageInfo",
  fields: [
    { kind: "primitive", name: "school_mask", type: "u32" },
    { kind: "primitive", name: "damage_float", type: "f32" },
    { kind: "primitive", name: "damage_uint", type: "u32" },
    { kind: "primitive", name: "absorb", type: "u32" },
    { kind: "primitive", name: "resist", type: "u32" },
  ],
};

export const SpellLog: FieldDef = {
  kind: "struct",
  name: "SpellLog",
  fields: [
    { kind: "enum", name: "effect", enumDef: SpellEffect },
    { kind: "primitive", name: "amount_of_logs", type: "u32" },
    {
      kind: "match",
      branches: [
        {
          condition: { kind: "equals", field: "effect", values: [8] }, // POWER_DRAIN
          fields: [
            { kind: "primitive", name: "target", type: "Guid" },
            { kind: "primitive", name: "amount", type: "u32" },
            { kind: "enum", name: "power", enumDef: Power },
            { kind: "primitive", name: "multiplier", type: "f32" },
          ],
        },
        {
          condition: { kind: "equals", field: "effect", values: [10, 67] }, // HEAL, HEAL_MAX_HEALTH
          fields: [
            { kind: "primitive", name: "target", type: "Guid" },
            { kind: "primitive", name: "heal_amount", type: "u32" },
            { kind: "primitive", name: "heal_critical", type: "u32" },
          ],
        },
        {
          condition: { kind: "equals", field: "effect", values: [30] }, // ENERGIZE
          fields: [
            { kind: "primitive", name: "target", type: "Guid" },
            { kind: "primitive", name: "energize_amount", type: "u32" },
            { kind: "primitive", name: "energize_power", type: "u32" },
          ],
        },
        {
          condition: { kind: "equals", field: "effect", values: [19] }, // ADD_EXTRA_ATTACKS
          fields: [
            { kind: "primitive", name: "target", type: "Guid" },
            { kind: "primitive", name: "extra_attacks", type: "u32" },
          ],
        },
        {
          condition: { kind: "equals", field: "effect", values: [24] }, // CREATE_ITEM
          fields: [{ kind: "primitive", name: "item", type: "u32" }],
        },
        {
          condition: { kind: "equals", field: "effect", values: [68] }, // INTERRUPT_CAST
          fields: [
            { kind: "primitive", name: "target", type: "Guid" },
            { kind: "primitive", name: "interrupted_spell", type: "u32" },
          ],
        },
        {
          condition: { kind: "equals", field: "effect", values: [111] }, // DURABILITY_DAMAGE
          fields: [
            { kind: "primitive", name: "target", type: "Guid" },
            { kind: "primitive", name: "item_to_damage", type: "u32" },
            { kind: "primitive", name: "unknown5", type: "u32" },
          ],
        },
        {
          condition: { kind: "equals", field: "effect", values: [101] }, // FEED_PET
          fields: [{ kind: "primitive", name: "feed_pet_item", type: "u32" }],
        },
        {
          condition: {
            kind: "equals",
            field: "effect",
            values: [
              1, 18, 38, 63, 69, 79, 91, 108, 113, 114, 116, 125, 126, 33, 59,
              102, 50, 28, 56, 41, 42, 87, 88, 89, 90, 73, 74, 76, 104, 105,
              106, 107, 112, 81, 83, 93, 97,
            ], // Multiple effects that just have a target GUID
          },
          fields: [{ kind: "primitive", name: "target", type: "Guid" }],
        },
      ],
    },
  ],
};

export const AuraLog: FieldDef = {
  kind: "struct",
  name: "AuraLog",
  fields: [
    { kind: "enum", name: "aura_type", enumDef: AuraType },
    {
      kind: "match",
      branches: [
        {
          condition: { kind: "equals", field: "aura_type", values: [3, 89] }, // PERIODIC_DAMAGE, PERIODIC_DAMAGE_PERCENT
          fields: [
            { kind: "primitive", name: "damage", type: "u32" },
            { kind: "enum", name: "school", enumDef: SpellSchool },
            { kind: "primitive", name: "absorbed", type: "u32" },
            { kind: "primitive", name: "resisted", type: "u32" },
          ],
        },
        {
          condition: { kind: "equals", field: "aura_type", values: [8, 20] }, // PERIODIC_HEAL, OBS_MOD_HEALTH
          fields: [{ kind: "primitive", name: "damage", type: "u32" }],
        },
        {
          condition: { kind: "equals", field: "aura_type", values: [21, 24] }, // OBS_MOD_MANA, PERIODIC_ENERGIZE
          fields: [
            { kind: "primitive", name: "misc_value", type: "u32" },
            { kind: "primitive", name: "damage", type: "u32" },
          ],
        },
        {
          condition: { kind: "equals", field: "aura_type", values: [64] }, // PERIODIC_MANA_LEECH
          fields: [
            { kind: "primitive", name: "misc_value", type: "u32" },
            { kind: "primitive", name: "damage", type: "u32" },
            { kind: "primitive", name: "gain_multiplier", type: "f32" },
          ],
        },
      ],
    },
  ],
};

export const MonsterMoveSplines: FieldDef = {
  kind: "struct",
  name: "MonsterMoveSplines",
  fields: [
    { kind: "primitive", name: "amount_of_spline_points", type: "u32" },
    {
      kind: "array",
      name: "spline_points",
      count: "amount_of_spline_points",
      elementType: {
        kind: "struct",
        name: "SplinePoint",
        fields: [
          { kind: "primitive", name: "x", type: "f32" },
          { kind: "primitive", name: "y", type: "f32" },
          { kind: "primitive", name: "z", type: "f32" },
        ],
      },
    },
  ],
};

// ============================================================
// Quest/Gossip/Experience System Enums and Structs
// ============================================================

export const ExperienceAwardType: EnumDef = {
  type: "u8",
  values: {
    0: "KILL",
    1: "NON_KILL",
  },
};

export const QuestGiverStatus: EnumDef = {
  type: "u8",
  values: {
    0: "NONE",
    1: "UNAVAILABLE",
    2: "CHAT",
    3: "INCOMPLETE",
    4: "REWARD_REP",
    5: "AVAILABLE",
    6: "REWARD_OLD",
    7: "REWARD2",
  },
};

// Quest item reward struct
export const QuestItemReward: FieldDef = {
  kind: "struct",
  name: "QuestItemReward",
  fields: [
    { kind: "primitive", name: "item", type: "u32" },
    { kind: "primitive", name: "item_count", type: "u32" },
  ],
};

// Quest details emote struct
export const QuestDetailsEmote: FieldDef = {
  kind: "struct",
  name: "QuestDetailsEmote",
  fields: [
    { kind: "primitive", name: "emote", type: "u32" },
    { kind: "primitive", name: "emote_delay", type: "u32" },
  ],
};

// Quest item (for gossip and quest lists)
export const QuestItem: FieldDef = {
  kind: "struct",
  name: "QuestItem",
  fields: [
    { kind: "primitive", name: "quest_id", type: "u32" },
    { kind: "primitive", name: "quest_icon", type: "u32" },
    { kind: "primitive", name: "level", type: "u32" },
    { kind: "primitive", name: "title", type: "CString" },
  ],
};

// Gossip item (v1.12)
export const GossipItem: FieldDef = {
  kind: "struct",
  name: "GossipItem",
  fields: [
    { kind: "primitive", name: "id", type: "u32" },
    { kind: "primitive", name: "item_icon", type: "u8" },
    { kind: "primitive", name: "coded", type: "u8" }, // Bool - password protected
    { kind: "primitive", name: "message", type: "CString" },
  ],
};

// Faction standing struct
export const FactionStanding: FieldDef = {
  kind: "struct",
  name: "FactionStanding",
  fields: [
    { kind: "primitive", name: "faction", type: "u32" },
    { kind: "primitive", name: "standing", type: "u32" },
  ],
};

// ============================================================
// Item Query System Structs
// ============================================================

// Item stat struct (v1.12)
export const ItemStat: FieldDef = {
  kind: "struct",
  name: "ItemStat",
  fields: [
    { kind: "primitive", name: "stat_type", type: "u32" },
    { kind: "primitive", name: "value", type: "i32" },
  ],
};

// Item damage type struct
export const ItemDamageType: FieldDef = {
  kind: "struct",
  name: "ItemDamageType",
  fields: [
    { kind: "primitive", name: "damage_minimum", type: "f32" },
    { kind: "primitive", name: "damage_maximum", type: "f32" },
    { kind: "primitive", name: "school", type: "u32" },
  ],
};

// Item spells struct
export const ItemSpells: FieldDef = {
  kind: "struct",
  name: "ItemSpells",
  fields: [
    { kind: "primitive", name: "spell", type: "u32" },
    { kind: "primitive", name: "spell_trigger", type: "u32" },
    { kind: "primitive", name: "spell_charges", type: "i32" },
    { kind: "primitive", name: "spell_cooldown", type: "i32" },
    { kind: "primitive", name: "spell_category", type: "u32" },
    { kind: "primitive", name: "spell_category_cooldown", type: "i32" },
  ],
};

// ============================================================
// Additional Quest System Structs
// ============================================================

// NPC text update emote struct
export const NpcTextUpdateEmote: FieldDef = {
  kind: "struct",
  name: "NpcTextUpdateEmote",
  fields: [
    { kind: "primitive", name: "delay", type: "u32" },
    { kind: "primitive", name: "emote", type: "u32" },
  ],
};

// Quest item requirement struct
export const QuestItemRequirement: FieldDef = {
  kind: "struct",
  name: "QuestItemRequirement",
  fields: [
    { kind: "primitive", name: "item", type: "u32" },
    { kind: "primitive", name: "item_count", type: "u32" },
    { kind: "primitive", name: "item_display_id", type: "u32" },
  ],
};

// Quest objective struct
export const QuestObjective: FieldDef = {
  kind: "struct",
  name: "QuestObjective",
  fields: [
    { kind: "primitive", name: "creature_id", type: "u32" },
    { kind: "primitive", name: "kill_count", type: "u32" },
    { kind: "primitive", name: "required_item_id", type: "u32" },
    { kind: "primitive", name: "required_item_count", type: "u32" },
  ],
};

// Vector2d struct (2D position)
export const Vector2d: FieldDef = {
  kind: "struct",
  name: "Vector2d",
  fields: [
    { kind: "primitive", name: "x", type: "f32" },
    { kind: "primitive", name: "y", type: "f32" },
  ],
};
