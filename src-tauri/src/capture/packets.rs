use std::collections::HashMap;
use std::sync::OnceLock;

pub fn get_opcode_name(build: u32, opcode: u32) -> &'static str {
    match build {
        5875 => vanilla_opcode_name(opcode),
        8606 => tbc_opcode_name(opcode),
        12340 => wotlk_opcode_name(opcode),
        15595 => cata_opcode_name(opcode),
        _ => "UNKNOWN",
    }
}

fn wotlk_opcode_name(opcode: u32) -> &'static str {
    static MAP: OnceLock<HashMap<u32, &'static str>> = OnceLock::new();
    let map = MAP.get_or_init(|| {
        let mut m = HashMap::new();

        // Auth
        m.insert(0x1EE, "CMSG_AUTH_SESSION");
        m.insert(0x1EF, "SMSG_AUTH_RESPONSE");
        m.insert(0x1EC, "SMSG_AUTH_CHALLENGE");

        // Character
        m.insert(0x0037, "CMSG_CHAR_ENUM");
        m.insert(0x003B, "SMSG_CHAR_ENUM");
        m.insert(0x0036, "CMSG_CHAR_CREATE");
        m.insert(0x003D, "CMSG_PLAYER_LOGIN");

        // Movement
        m.insert(0x00B5, "MSG_MOVE_START_FORWARD");
        m.insert(0x00B6, "MSG_MOVE_START_BACKWARD");
        m.insert(0x00B7, "MSG_MOVE_STOP");
        m.insert(0x00B8, "MSG_MOVE_START_STRAFE_LEFT");
        m.insert(0x00B9, "MSG_MOVE_START_STRAFE_RIGHT");
        m.insert(0x00BA, "MSG_MOVE_STOP_STRAFE");
        m.insert(0x00BB, "MSG_MOVE_JUMP");
        m.insert(0x00BC, "MSG_MOVE_START_TURN_LEFT");
        m.insert(0x00BD, "MSG_MOVE_START_TURN_RIGHT");
        m.insert(0x00BE, "MSG_MOVE_STOP_TURN");
        m.insert(0x00BF, "MSG_MOVE_START_PITCH_UP");
        m.insert(0x00C0, "MSG_MOVE_START_PITCH_DOWN");
        m.insert(0x00C1, "MSG_MOVE_STOP_PITCH");
        m.insert(0x00C7, "MSG_MOVE_FALL_LAND");
        m.insert(0x00C9, "MSG_MOVE_START_SWIM");
        m.insert(0x00CA, "MSG_MOVE_STOP_SWIM");
        m.insert(0x00DA, "MSG_MOVE_SET_FACING");
        m.insert(0x00EE, "MSG_MOVE_HEARTBEAT");
        m.insert(0x00E1, "MSG_MOVE_SET_RUN_MODE");
        m.insert(0x00E2, "MSG_MOVE_SET_WALK_MODE");

        // Chat
        m.insert(0x0095, "CMSG_MESSAGECHAT");
        m.insert(0x0096, "SMSG_MESSAGECHAT");

        // Spell
        m.insert(0x012E, "CMSG_CAST_SPELL");
        m.insert(0x0130, "SMSG_SPELL_START");
        m.insert(0x0131, "SMSG_SPELL_GO");

        // Combat
        m.insert(0x01B2, "SMSG_ATTACKSTART");
        m.insert(0x01B3, "SMSG_ATTACKSTOP");
        m.insert(0x0141, "CMSG_ATTACKSWING");
        m.insert(0x0142, "CMSG_ATTACKSTOP");

        // Update
        m.insert(0x00A9, "SMSG_UPDATE_OBJECT");
        m.insert(0x00A8, "SMSG_COMPRESSED_UPDATE_OBJECT");

        // Query
        m.insert(0x0050, "CMSG_NAME_QUERY");
        m.insert(0x0051, "SMSG_NAME_QUERY_RESPONSE");
        m.insert(0x0060, "CMSG_CREATURE_QUERY");
        m.insert(0x0061, "SMSG_CREATURE_QUERY_RESPONSE");

        // Misc
        m.insert(0x0001, "CMSG_BOOTME");
        m.insert(0x001C, "SMSG_PONG");
        m.insert(0x01DC, "CMSG_PING");
        m.insert(0x03FD, "CMSG_WORLD_TELEPORT");
        m.insert(0x0046, "SMSG_TRANSFER_PENDING");
        m.insert(0x003E, "SMSG_NEW_WORLD");
        m.insert(0x006C, "SMSG_DESTROY_OBJECT");

        // Guild
        m.insert(0x008B, "CMSG_GUILD_QUERY");
        m.insert(0x008C, "SMSG_GUILD_QUERY_RESPONSE");

        // Who
        m.insert(0x0062, "CMSG_WHO");
        m.insert(0x0063, "SMSG_WHO");

        // Loot
        m.insert(0x015D, "CMSG_LOOT");
        m.insert(0x0160, "SMSG_LOOT_RESPONSE");
        m.insert(0x015E, "CMSG_LOOT_MONEY");
        m.insert(0x015F, "CMSG_AUTOSTORE_LOOT_ITEM");

        // Logout
        m.insert(0x004B, "CMSG_PLAYER_LOGOUT");
        m.insert(0x004C, "SMSG_LOGOUT_RESPONSE");
        m.insert(0x004E, "SMSG_LOGOUT_COMPLETE");

        m
    });
    map.get(&opcode).copied().unwrap_or("UNKNOWN")
}

fn vanilla_opcode_name(opcode: u32) -> &'static str {
    static MAP: OnceLock<HashMap<u32, &'static str>> = OnceLock::new();
    let map = MAP.get_or_init(|| {
        let mut m = HashMap::new();

        // Authentication & Connection
        m.insert(0x0000, "CMSG_NULL_ACTION");
        m.insert(0x01DC, "CMSG_PING");
        m.insert(0x01ED, "CMSG_AUTH_SESSION");
        m.insert(0x01EC, "SMSG_AUTH_CHALLENGE");
        m.insert(0x01EE, "SMSG_AUTH_RESPONSE");
        m.insert(0x001D, "SMSG_PONG");

        // Character Management
        m.insert(0x0036, "CMSG_CHAR_CREATE");
        m.insert(0x0037, "CMSG_CHAR_ENUM");
        m.insert(0x0038, "CMSG_CHAR_DELETE");
        m.insert(0x003D, "CMSG_PLAYER_LOGIN");
        m.insert(0x02C7, "CMSG_CHAR_RENAME");
        m.insert(0x003A, "SMSG_CHAR_CREATE");
        m.insert(0x003B, "SMSG_CHAR_ENUM");
        m.insert(0x003C, "SMSG_CHAR_DELETE");
        m.insert(0x02C8, "SMSG_CHAR_RENAME");
        m.insert(0x0041, "SMSG_CHARACTER_LOGIN_FAILED");

        // Logout
        m.insert(0x004B, "CMSG_LOGOUT_REQUEST");
        m.insert(0x004E, "CMSG_LOGOUT_CANCEL");
        m.insert(0x004C, "SMSG_LOGOUT_RESPONSE");
        m.insert(0x004D, "SMSG_LOGOUT_COMPLETE");
        m.insert(0x004F, "SMSG_LOGOUT_CANCEL_ACK");

        // World Entry & Time
        m.insert(0x003E, "SMSG_NEW_WORLD");
        m.insert(0x003F, "SMSG_TRANSFER_PENDING");
        m.insert(0x0042, "SMSG_LOGIN_SETTIMESPEED");
        m.insert(0x0236, "SMSG_LOGIN_VERIFY_WORLD");
        m.insert(0x01CE, "CMSG_QUERY_TIME");
        m.insert(0x01CF, "SMSG_QUERY_TIME_RESPONSE");

        // Tutorial & Account Data
        m.insert(0x00FD, "SMSG_TUTORIAL_FLAGS");
        m.insert(0x00FE, "CMSG_TUTORIAL_FLAG");
        m.insert(0x0100, "CMSG_TUTORIAL_CLEAR");
        m.insert(0x020B, "CMSG_UPDATE_ACCOUNT_DATA");
        m.insert(0x020C, "SMSG_UPDATE_ACCOUNT_DATA");
        m.insert(0x020A, "CMSG_REQUEST_ACCOUNT_DATA");
        m.insert(0x020D, "SMSG_UPDATE_ACCOUNT_DATA_COMPLETE");
        m.insert(0x0209, "SMSG_ACCOUNT_DATA_TIMES");

        // Query Responses
        m.insert(0x0050, "CMSG_NAME_QUERY");
        m.insert(0x0051, "SMSG_NAME_QUERY_RESPONSE");
        m.insert(0x0060, "CMSG_CREATURE_QUERY");
        m.insert(0x0061, "SMSG_CREATURE_QUERY_RESPONSE");
        m.insert(0x0056, "CMSG_ITEM_QUERY_SINGLE");
        m.insert(0x0057, "CMSG_ITEM_QUERY_MULTIPLE");
        m.insert(0x0058, "SMSG_ITEM_QUERY_SINGLE_RESPONSE");
        m.insert(0x005E, "CMSG_GAMEOBJECT_QUERY");
        m.insert(0x005F, "SMSG_GAMEOBJECT_QUERY_RESPONSE");
        m.insert(0x005A, "CMSG_PAGE_TEXT_QUERY");
        m.insert(0x005B, "SMSG_PAGE_TEXT_QUERY_RESPONSE");
        m.insert(0x0243, "CMSG_ITEM_TEXT_QUERY");
        m.insert(0x0244, "SMSG_ITEM_TEXT_QUERY_RESPONSE");
        m.insert(0x0216, "MSG_CORPSE_QUERY");
        m.insert(0x02C4, "CMSG_ITEM_NAME_QUERY");
        m.insert(0x02C5, "SMSG_ITEM_NAME_QUERY_RESPONSE");

        // Object Updates
        m.insert(0x00A9, "SMSG_UPDATE_OBJECT");
        m.insert(0x01F6, "SMSG_COMPRESSED_UPDATE_OBJECT");
        m.insert(0x02B3, "SMSG_COMPRESSED_MOVES");
        m.insert(0x00AA, "SMSG_DESTROY_OBJECT");

        // Movement - Basic
        m.insert(0x00EE, "MSG_MOVE_HEARTBEAT");
        m.insert(0x00B5, "MSG_MOVE_START_FORWARD");
        m.insert(0x00B6, "MSG_MOVE_START_BACKWARD");
        m.insert(0x00B7, "MSG_MOVE_STOP");
        m.insert(0x00B8, "MSG_MOVE_START_STRAFE_LEFT");
        m.insert(0x00B9, "MSG_MOVE_START_STRAFE_RIGHT");
        m.insert(0x00BA, "MSG_MOVE_STOP_STRAFE");
        m.insert(0x00BB, "MSG_MOVE_JUMP");
        m.insert(0x00BC, "MSG_MOVE_START_TURN_LEFT");
        m.insert(0x00BD, "MSG_MOVE_START_TURN_RIGHT");
        m.insert(0x00BE, "MSG_MOVE_STOP_TURN");
        m.insert(0x00DA, "MSG_MOVE_SET_FACING");
        m.insert(0x00DB, "MSG_MOVE_SET_PITCH");
        m.insert(0x00DC, "MSG_MOVE_WORLDPORT_ACK");
        m.insert(0x00C9, "MSG_MOVE_FALL_LAND");

        // Movement - Advanced
        m.insert(0x026A, "CMSG_SET_ACTIVE_MOVER");
        m.insert(0x02C9, "CMSG_MOVE_SPLINE_DONE");
        m.insert(0x02CA, "CMSG_MOVE_FALL_RESET");
        m.insert(0x02CE, "CMSG_MOVE_TIME_SKIPPED");
        m.insert(0x02CF, "CMSG_MOVE_FEATHER_FALL_ACK");
        m.insert(0x02D0, "CMSG_MOVE_WATER_WALK_ACK");
        m.insert(0x02D1, "CMSG_MOVE_NOT_ACTIVE_MOVER");
        m.insert(0x00C7, "MSG_MOVE_TELEPORT_ACK");
        m.insert(0x00C5, "MSG_MOVE_TELEPORT");
        m.insert(0x00F1, "MSG_MOVE_KNOCK_BACK");

        // Movement - Speed Changes (Force)
        m.insert(0x02DA, "SMSG_FORCE_WALK_SPEED_CHANGE");
        m.insert(0x00E2, "SMSG_FORCE_RUN_SPEED_CHANGE");
        m.insert(0x00E4, "SMSG_FORCE_RUN_BACK_SPEED_CHANGE");
        m.insert(0x00E6, "SMSG_FORCE_SWIM_SPEED_CHANGE");
        m.insert(0x02DC, "SMSG_FORCE_SWIM_BACK_SPEED_CHANGE");
        m.insert(0x02DE, "SMSG_FORCE_TURN_RATE_CHANGE");

        // Movement - Speed Changes (Spline)
        m.insert(0x0301, "SMSG_SPLINE_SET_WALK_SPEED");
        m.insert(0x02FE, "SMSG_SPLINE_SET_RUN_SPEED");
        m.insert(0x02FF, "SMSG_SPLINE_SET_RUN_BACK_SPEED");
        m.insert(0x0300, "SMSG_SPLINE_SET_SWIM_SPEED");
        m.insert(0x0302, "SMSG_SPLINE_SET_SWIM_BACK_SPEED");
        m.insert(0x0303, "SMSG_SPLINE_SET_TURN_RATE");

        // Movement - Speed Changes (MSG)
        m.insert(0x00D1, "MSG_MOVE_SET_WALK_SPEED");
        m.insert(0x00CD, "MSG_MOVE_SET_RUN_SPEED");
        m.insert(0x00CF, "MSG_MOVE_SET_RUN_BACK_SPEED");
        m.insert(0x00D3, "MSG_MOVE_SET_SWIM_SPEED");
        m.insert(0x00D5, "MSG_MOVE_SET_SWIM_BACK_SPEED");
        m.insert(0x00D8, "MSG_MOVE_SET_TURN_RATE");

        // Movement - Flags (Force)
        m.insert(0x00E8, "SMSG_FORCE_MOVE_ROOT");
        m.insert(0x00E9, "CMSG_FORCE_MOVE_ROOT_ACK");
        m.insert(0x00EA, "SMSG_FORCE_MOVE_UNROOT");
        m.insert(0x00DE, "SMSG_MOVE_WATER_WALK");
        m.insert(0x00DF, "SMSG_MOVE_LAND_WALK");
        m.insert(0x00F4, "SMSG_MOVE_SET_HOVER");
        m.insert(0x00F5, "SMSG_MOVE_UNSET_HOVER");
        m.insert(0x00F2, "SMSG_MOVE_FEATHER_FALL");
        m.insert(0x00F3, "SMSG_MOVE_NORMAL_FALL");
        m.insert(0x00EF, "SMSG_MOVE_KNOCK_BACK");

        // Movement - Flags (Spline)
        m.insert(0x031A, "SMSG_SPLINE_MOVE_ROOT");
        m.insert(0x0304, "SMSG_SPLINE_MOVE_UNROOT");
        m.insert(0x0309, "SMSG_SPLINE_MOVE_WATER_WALK");
        m.insert(0x030A, "SMSG_SPLINE_MOVE_LAND_WALK");
        m.insert(0x0307, "SMSG_SPLINE_MOVE_SET_HOVER");
        m.insert(0x0308, "SMSG_SPLINE_MOVE_UNSET_HOVER");
        m.insert(0x0305, "SMSG_SPLINE_MOVE_FEATHER_FALL");
        m.insert(0x0306, "SMSG_SPLINE_MOVE_NORMAL_FALL");
        m.insert(0x030D, "SMSG_SPLINE_MOVE_SET_RUN_MODE");
        m.insert(0x030E, "SMSG_SPLINE_MOVE_SET_WALK_MODE");

        // Movement - Flags (MSG)
        m.insert(0x00EC, "MSG_MOVE_ROOT");
        m.insert(0x00ED, "MSG_MOVE_UNROOT");
        m.insert(0x02B1, "MSG_MOVE_WATER_WALK");
        m.insert(0x00F7, "MSG_MOVE_HOVER");
        m.insert(0x02B0, "MSG_MOVE_FEATHER_FALL");

        // Monster Movement
        m.insert(0x00DD, "SMSG_MONSTER_MOVE");
        m.insert(0x02AE, "SMSG_MONSTER_MOVE_TRANSPORT");

        // Combat
        m.insert(0x0141, "CMSG_ATTACKSWING");
        m.insert(0x0142, "CMSG_ATTACKSTOP");
        m.insert(0x0143, "SMSG_ATTACKSTART");
        m.insert(0x0144, "SMSG_ATTACKSTOP");
        m.insert(0x0145, "SMSG_ATTACKSWING_NOTINRANGE");
        m.insert(0x0146, "SMSG_ATTACKSWING_BADFACING");
        m.insert(0x0147, "SMSG_ATTACKSWING_NOTSTANDING");
        m.insert(0x0148, "SMSG_ATTACKSWING_DEADTARGET");
        m.insert(0x0149, "SMSG_ATTACKSWING_CANT_ATTACK");
        m.insert(0x014A, "SMSG_ATTACKERSTATEUPDATE");

        // Selection & Targeting
        m.insert(0x013D, "CMSG_SET_SELECTION");

        // Spell Casting
        m.insert(0x012E, "CMSG_CAST_SPELL");
        m.insert(0x012F, "CMSG_CANCEL_CAST");
        m.insert(0x0136, "CMSG_CANCEL_AURA");
        m.insert(0x026D, "CMSG_CANCEL_AUTO_REPEAT_SPELL");
        m.insert(0x013B, "CMSG_CANCEL_CHANNELLING");
        m.insert(0x00AB, "CMSG_USE_ITEM");
        m.insert(0x012D, "CMSG_NEW_SPELL_SLOT");
        m.insert(0x0131, "SMSG_SPELL_START");
        m.insert(0x0132, "SMSG_SPELL_GO");
        m.insert(0x0130, "SMSG_CAST_RESULT");
        m.insert(0x0134, "SMSG_SPELL_COOLDOWN");
        m.insert(0x0139, "MSG_CHANNEL_START");
        m.insert(0x013A, "MSG_CHANNEL_UPDATE");
        m.insert(0x0152, "SMSG_SPELL_INTERRUPTED");
        m.insert(0x01E2, "SMSG_SPELL_DELAYED");
        m.insert(0x02A6, "SMSG_SPELL_FAILED_OTHER");
        m.insert(0x0330, "SMSG_SPELL_UPDATE_CHAIN_TARGETS");
        m.insert(0x0127, "SMSG_SET_PROFICIENCY");
        m.insert(0x012A, "SMSG_INITIAL_SPELLS");
        m.insert(0x012B, "SMSG_LEARNED_SPELL");
        m.insert(0x0203, "SMSG_REMOVED_SPELL");
        m.insert(0x0133, "SMSG_SPELL_FAILURE");
        m.insert(0x01DE, "SMSG_CLEAR_COOLDOWN");

        // Auras
        m.insert(0x0137, "SMSG_UPDATE_AURA_DURATION");
        m.insert(0x024E, "SMSG_PERIODICAURALOG");

        // Combat Log
        m.insert(0x0150, "SMSG_SPELLHEALLOG");
        m.insert(0x014C, "SMSG_SPELLLOGMISS");
        m.insert(0x0151, "SMSG_SPELLENERGIZELOG");
        m.insert(0x024C, "SMSG_SPELLLOGEXECUTE");
        m.insert(0x033F, "SMSG_SPELLINSTAKILLLOG");

        // Action Bar
        m.insert(0x0128, "CMSG_SET_ACTION_BUTTON");
        m.insert(0x0129, "SMSG_ACTION_BUTTONS");

        // Death & Resurrection
        m.insert(0x02E7, "SMSG_DEATH_RELEASE_LOCATION");
        m.insert(0x02BD, "SMSG_DURABILITY_DAMAGE_DEATH");
        m.insert(0x02E8, "SMSG_CORPSE_RECLAIM_DELAY");
        m.insert(0x015A, "CMSG_REPOP_REQUEST");
        m.insert(0x015C, "CMSG_RESURRECT_RESPONSE");
        m.insert(0x01D2, "CMSG_RECLAIM_CORPSE");
        m.insert(0x015B, "SMSG_RESURRECT_REQUEST");
        m.insert(0x0310, "SMSG_PRE_RESURRECT");
        m.insert(0x0222, "SMSG_SPIRIT_HEALER_CONFIRM");
        m.insert(0x021C, "CMSG_SPIRIT_HEALER_ACTIVATE");

        // NPC Interaction - Gossip
        m.insert(0x017B, "CMSG_GOSSIP_HELLO");
        m.insert(0x017C, "CMSG_GOSSIP_SELECT_OPTION");
        m.insert(0x017D, "SMSG_GOSSIP_MESSAGE");
        m.insert(0x017E, "SMSG_GOSSIP_COMPLETE");
        m.insert(0x0223, "SMSG_GOSSIP_POI");
        m.insert(0x0180, "SMSG_NPC_TEXT_UPDATE");
        m.insert(0x017F, "CMSG_NPC_TEXT_QUERY");

        // NPC Interaction - Vendor
        m.insert(0x019E, "CMSG_LIST_INVENTORY");
        m.insert(0x019F, "SMSG_LIST_INVENTORY");
        m.insert(0x01A0, "CMSG_SELL_ITEM");
        m.insert(0x01A1, "SMSG_SELL_ITEM");
        m.insert(0x01A2, "CMSG_BUY_ITEM");
        m.insert(0x01A3, "CMSG_BUY_ITEM_IN_SLOT");
        m.insert(0x01A4, "SMSG_BUY_ITEM");
        m.insert(0x01A5, "SMSG_BUY_FAILED");
        m.insert(0x0166, "SMSG_ITEM_PUSH_RESULT");
        m.insert(0x0290, "CMSG_BUYBACK_ITEM");

        // NPC Interaction - Trainer
        m.insert(0x01B0, "CMSG_TRAINER_LIST");
        m.insert(0x01B1, "SMSG_TRAINER_LIST");
        m.insert(0x01B2, "CMSG_TRAINER_BUY_SPELL");
        m.insert(0x01B3, "SMSG_TRAINER_BUY_SUCCEEDED");
        m.insert(0x01B4, "SMSG_TRAINER_BUY_FAILED");

        // NPC Interaction - Banker
        m.insert(0x01B5, "CMSG_BANKER_ACTIVATE");
        m.insert(0x01B8, "SMSG_SHOW_BANK");
        m.insert(0x01B9, "CMSG_BUY_BANK_SLOT");
        m.insert(0x0283, "CMSG_AUTOBANK_ITEM");
        m.insert(0x0282, "CMSG_AUTOSTORE_BANK_ITEM");

        // NPC Interaction - Other
        m.insert(0x01F2, "MSG_TABARDVENDOR_ACTIVATE");

        // Taxi
        m.insert(0x01AA, "CMSG_TAXINODE_STATUS_QUERY");
        m.insert(0x01AB, "SMSG_TAXINODE_STATUS");
        m.insert(0x01AC, "CMSG_TAXIQUERYAVAILABLENODES");
        m.insert(0x01A9, "SMSG_SHOWTAXINODES");
        m.insert(0x01AD, "CMSG_ACTIVATETAXI");
        m.insert(0x01AE, "SMSG_ACTIVATETAXIREPLY");
        m.insert(0x01AF, "SMSG_NEW_TAXI_PATH");

        // Talents & Skills
        m.insert(0x0251, "CMSG_LEARN_TALENT");
        m.insert(0x0213, "CMSG_UNLEARN_TALENTS");
        m.insert(0x0201, "CMSG_UNLEARN_SPELL");
        m.insert(0x0202, "CMSG_UNLEARN_SKILL");

        // Bind Point
        m.insert(0x0155, "SMSG_BINDPOINTUPDATE");
        m.insert(0x0157, "SMSG_BINDZONEREPLY");
        m.insert(0x0158, "SMSG_PLAYERBOUND");
        m.insert(0x0154, "CMSG_SETDEATHBINDPOINT");
        m.insert(0x0156, "CMSG_GETDEATHBINDZONE");

        // Rest & XP
        m.insert(0x021E, "SMSG_SET_REST_START");
        m.insert(0x01D0, "SMSG_LOG_XPGAIN");
        m.insert(0x01D4, "SMSG_LEVELUP_INFO");

        // Exploration
        m.insert(0x01F8, "SMSG_EXPLORATION_EXPERIENCE");

        // World States & Factions
        m.insert(0x02C2, "SMSG_INIT_WORLD_STATES");
        m.insert(0x0122, "SMSG_INITIALIZE_FACTIONS");
        m.insert(0x0124, "SMSG_SET_FACTION_STANDING");
        m.insert(0x0123, "SMSG_SET_FACTION_VISIBLE");
        m.insert(0x02A5, "SMSG_SET_FORCED_REACTIONS");
        m.insert(0x0125, "CMSG_SET_FACTION_ATWAR");
        m.insert(0x0317, "CMSG_SET_FACTION_INACTIVE");

        // Cinematic
        m.insert(0x00FA, "SMSG_TRIGGER_CINEMATIC");
        m.insert(0x00FB, "CMSG_NEXT_CINEMATIC_CAMERA");
        m.insert(0x00FC, "CMSG_COMPLETE_CINEMATIC");

        // Zone
        m.insert(0x01F4, "CMSG_ZONEUPDATE");

        // Item Management
        m.insert(0x00AC, "CMSG_OPEN_ITEM");
        m.insert(0x00AD, "CMSG_READ_ITEM");
        m.insert(0x00AE, "SMSG_READ_ITEM_OK");
        m.insert(0x00AF, "SMSG_READ_ITEM_FAILED");
        m.insert(0x00B0, "SMSG_ITEM_COOLDOWN");
        m.insert(0x0112, "SMSG_INVENTORY_CHANGE_FAILURE");
        m.insert(0x0106, "CMSG_AUTOEQUIP_GROUND_ITEM");
        m.insert(0x0107, "CMSG_AUTOSTORE_GROUND_ITEM");
        m.insert(0x0108, "CMSG_AUTOSTORE_LOOT_ITEM");
        m.insert(0x0109, "CMSG_STORE_LOOT_IN_SLOT");
        m.insert(0x010A, "CMSG_AUTOEQUIP_ITEM");
        m.insert(0x010B, "CMSG_AUTOSTORE_BAG_ITEM");
        m.insert(0x010C, "CMSG_SWAP_ITEM");
        m.insert(0x010D, "CMSG_SWAP_INV_ITEM");
        m.insert(0x010E, "CMSG_SPLIT_ITEM");
        m.insert(0x010F, "CMSG_AUTOEQUIP_ITEM_SLOT");
        m.insert(0x0110, "CMSG_DROP_ITEM");
        m.insert(0x0111, "CMSG_DESTROYITEM");
        m.insert(0x0114, "CMSG_INSPECT");
        m.insert(0x0115, "SMSG_INSPECT");
        m.insert(0x02D6, "MSG_INSPECT_HONOR_STATS");
        m.insert(0x02A8, "CMSG_REPAIR_ITEM");
        m.insert(0x01EB, "SMSG_ITEM_TIME_UPDATE");
        m.insert(0x0268, "CMSG_SET_AMMO");
        m.insert(0x01D3, "CMSG_WRAP_ITEM");

        // Gameobject
        m.insert(0x00B1, "CMSG_GAMEOBJ_USE");

        // Area Trigger
        m.insert(0x00B4, "CMSG_AREATRIGGER");

        // Chat
        m.insert(0x0095, "CMSG_MESSAGECHAT");
        m.insert(0x0096, "SMSG_MESSAGECHAT");
        m.insert(0x0225, "CMSG_CHAT_IGNORED");
        m.insert(0x0219, "SMSG_CHAT_WRONG_FACTION");
        m.insert(0x02A9, "SMSG_CHAT_PLAYER_NOT_FOUND");
        m.insert(0x02FD, "SMSG_CHAT_RESTRICTED");
        m.insert(0x032D, "SMSG_CHAT_PLAYER_AMBIGUOUS");
        m.insert(0x0331, "CMSG_CHAT_FILTERED");

        // Emote
        m.insert(0x0102, "CMSG_EMOTE");
        m.insert(0x0104, "CMSG_TEXT_EMOTE");
        m.insert(0x0105, "SMSG_TEXT_EMOTE");
        m.insert(0x0103, "SMSG_EMOTE");

        // Channel
        m.insert(0x0097, "CMSG_JOIN_CHANNEL");
        m.insert(0x0098, "CMSG_LEAVE_CHANNEL");
        m.insert(0x0099, "SMSG_CHANNEL_NOTIFY");
        m.insert(0x009A, "CMSG_CHANNEL_LIST");
        m.insert(0x009B, "SMSG_CHANNEL_LIST");
        m.insert(0x009C, "CMSG_CHANNEL_PASSWORD");
        m.insert(0x009D, "CMSG_CHANNEL_SET_OWNER");
        m.insert(0x009E, "CMSG_CHANNEL_OWNER");
        m.insert(0x009F, "CMSG_CHANNEL_MODERATOR");
        m.insert(0x00A0, "CMSG_CHANNEL_UNMODERATOR");
        m.insert(0x00A1, "CMSG_CHANNEL_MUTE");
        m.insert(0x00A2, "CMSG_CHANNEL_UNMUTE");
        m.insert(0x00A3, "CMSG_CHANNEL_INVITE");
        m.insert(0x00A4, "CMSG_CHANNEL_KICK");
        m.insert(0x00A5, "CMSG_CHANNEL_BAN");
        m.insert(0x00A6, "CMSG_CHANNEL_UNBAN");
        m.insert(0x00A7, "CMSG_CHANNEL_ANNOUNCEMENTS");
        m.insert(0x00A8, "CMSG_CHANNEL_MODERATE");

        // Social - Who & Friends
        m.insert(0x0062, "CMSG_WHO");
        m.insert(0x0063, "SMSG_WHO");
        m.insert(0x0066, "CMSG_FRIEND_LIST");
        m.insert(0x0067, "SMSG_FRIEND_LIST");
        m.insert(0x0068, "SMSG_FRIEND_STATUS");
        m.insert(0x0069, "CMSG_ADD_FRIEND");
        m.insert(0x006A, "CMSG_DEL_FRIEND");
        m.insert(0x006B, "SMSG_IGNORE_LIST");
        m.insert(0x006C, "CMSG_ADD_IGNORE");
        m.insert(0x006D, "CMSG_DEL_IGNORE");

        // Group
        m.insert(0x006E, "CMSG_GROUP_INVITE");
        m.insert(0x006F, "SMSG_GROUP_INVITE");
        m.insert(0x0071, "MSG_PARTY_LEAVE");
        m.insert(0x0072, "CMSG_GROUP_ACCEPT");
        m.insert(0x0073, "CMSG_GROUP_DECLINE");
        m.insert(0x0074, "SMSG_GROUP_DECLINE");
        m.insert(0x0075, "CMSG_GROUP_UNINVITE");
        m.insert(0x0077, "SMSG_GROUP_UNINVITE");
        m.insert(0x0078, "CMSG_GROUP_SET_LEADER");
        m.insert(0x0079, "SMSG_GROUP_SET_LEADER");
        m.insert(0x007A, "CMSG_LOOT_METHOD");
        m.insert(0x007B, "CMSG_GROUP_DISBAND");
        m.insert(0x007C, "SMSG_GROUP_DESTROYED");
        m.insert(0x007D, "SMSG_GROUP_LIST");
        m.insert(0x007E, "SMSG_PARTY_MEMBER_STATS");
        m.insert(0x007F, "SMSG_PARTY_COMMAND_RESULT");
        m.insert(0x027E, "CMSG_GROUP_CHANGE_SUB_GROUP");
        m.insert(0x0280, "CMSG_GROUP_SWAP_SUB_GROUP");
        m.insert(0x028F, "CMSG_GROUP_ASSISTANT_LEADER");
        m.insert(0x028E, "CMSG_GROUP_RAID_CONVERT");
        m.insert(0x027F, "CMSG_REQUEST_PARTY_MEMBER_STATS");
        m.insert(0x02F2, "SMSG_PARTY_MEMBER_STATS_FULL");
        m.insert(0x0321, "MSG_RAID_TARGET_UPDATE");
        m.insert(0x0322, "MSG_RAID_READY_CHECK");
        m.insert(0x01D5, "MSG_MINIMAP_PING");
        m.insert(0x01FB, "MSG_RANDOM_ROLL");

        // Loot
        m.insert(0x015D, "CMSG_LOOT");
        m.insert(0x015E, "CMSG_LOOT_MONEY");
        m.insert(0x015F, "CMSG_LOOT_RELEASE");
        m.insert(0x0160, "SMSG_LOOT_RESPONSE");
        m.insert(0x0161, "SMSG_LOOT_RELEASE_RESPONSE");
        m.insert(0x0162, "SMSG_LOOT_REMOVED");
        m.insert(0x0163, "SMSG_LOOT_MONEY_NOTIFY");
        m.insert(0x0165, "SMSG_LOOT_CLEAR_MONEY");
        m.insert(0x02A0, "CMSG_LOOT_ROLL");
        m.insert(0x02A1, "SMSG_LOOT_START_ROLL");
        m.insert(0x02A2, "SMSG_LOOT_ROLL");
        m.insert(0x02A3, "CMSG_LOOT_MASTER_GIVE");
        m.insert(0x02A4, "SMSG_LOOT_MASTER_LIST");
        m.insert(0x029F, "SMSG_LOOT_ROLL_WON");
        m.insert(0x029E, "SMSG_LOOT_ALL_PASSED");

        // Trade
        m.insert(0x0116, "CMSG_INITIATE_TRADE");
        m.insert(0x0117, "CMSG_BEGIN_TRADE");
        m.insert(0x0118, "CMSG_BUSY_TRADE");
        m.insert(0x0119, "CMSG_IGNORE_TRADE");
        m.insert(0x011A, "CMSG_ACCEPT_TRADE");
        m.insert(0x011B, "CMSG_UNACCEPT_TRADE");
        m.insert(0x011C, "CMSG_CANCEL_TRADE");
        m.insert(0x011D, "CMSG_SET_TRADE_ITEM");
        m.insert(0x011E, "CMSG_CLEAR_TRADE_ITEM");
        m.insert(0x011F, "CMSG_SET_TRADE_GOLD");
        m.insert(0x0120, "SMSG_TRADE_STATUS");
        m.insert(0x0121, "SMSG_TRADE_STATUS_EXTENDED");

        // Quest
        m.insert(0x005C, "CMSG_QUEST_QUERY");
        m.insert(0x005D, "SMSG_QUEST_QUERY_RESPONSE");
        m.insert(0x0182, "CMSG_QUESTGIVER_STATUS_QUERY");
        m.insert(0x0183, "SMSG_QUESTGIVER_STATUS");
        m.insert(0x0184, "CMSG_QUESTGIVER_HELLO");
        m.insert(0x0185, "SMSG_QUESTGIVER_QUEST_LIST");
        m.insert(0x0186, "CMSG_QUESTGIVER_QUERY_QUEST");
        m.insert(0x0187, "CMSG_QUESTGIVER_QUEST_AUTOLAUNCH");
        m.insert(0x0188, "SMSG_QUESTGIVER_QUEST_DETAILS");
        m.insert(0x0189, "CMSG_QUESTGIVER_ACCEPT_QUEST");
        m.insert(0x018A, "CMSG_QUESTGIVER_COMPLETE_QUEST");
        m.insert(0x018B, "SMSG_QUESTGIVER_REQUEST_ITEMS");
        m.insert(0x018C, "CMSG_QUESTGIVER_REQUEST_REWARD");
        m.insert(0x018D, "SMSG_QUESTGIVER_OFFER_REWARD");
        m.insert(0x018E, "CMSG_QUESTGIVER_CHOOSE_REWARD");
        m.insert(0x018F, "SMSG_QUESTGIVER_QUEST_INVALID");
        m.insert(0x0190, "CMSG_QUESTGIVER_CANCEL");
        m.insert(0x0191, "SMSG_QUESTGIVER_QUEST_COMPLETE");
        m.insert(0x0192, "SMSG_QUESTGIVER_QUEST_FAILED");
        m.insert(0x0193, "CMSG_QUESTLOG_SWAP_QUEST");
        m.insert(0x0194, "CMSG_QUESTLOG_REMOVE_QUEST");
        m.insert(0x0195, "SMSG_QUESTLOG_FULL");
        m.insert(0x0196, "SMSG_QUESTUPDATE_FAILED");
        m.insert(0x0197, "SMSG_QUESTUPDATE_FAILEDTIMER");
        m.insert(0x0198, "SMSG_QUESTUPDATE_COMPLETE");
        m.insert(0x0199, "SMSG_QUESTUPDATE_ADD_KILL");
        m.insert(0x019A, "SMSG_QUESTUPDATE_ADD_ITEM");
        m.insert(0x019B, "CMSG_QUEST_CONFIRM_ACCEPT");
        m.insert(0x019C, "SMSG_QUEST_CONFIRM_ACCEPT");
        m.insert(0x019D, "CMSG_PUSHQUESTTOPARTY");

        // Guild
        m.insert(0x0054, "CMSG_GUILD_QUERY");
        m.insert(0x0055, "SMSG_GUILD_QUERY_RESPONSE");
        m.insert(0x0081, "CMSG_GUILD_CREATE");
        m.insert(0x0082, "CMSG_GUILD_INVITE");
        m.insert(0x0083, "SMSG_GUILD_INVITE");
        m.insert(0x0084, "CMSG_GUILD_ACCEPT");
        m.insert(0x0085, "CMSG_GUILD_DECLINE");
        m.insert(0x0086, "SMSG_GUILD_DECLINE");
        m.insert(0x0087, "CMSG_GUILD_INFO");
        m.insert(0x0088, "SMSG_GUILD_INFO");
        m.insert(0x0089, "CMSG_GUILD_ROSTER");
        m.insert(0x008A, "SMSG_GUILD_ROSTER");
        m.insert(0x008B, "CMSG_GUILD_PROMOTE");
        m.insert(0x008C, "CMSG_GUILD_DEMOTE");
        m.insert(0x008D, "CMSG_GUILD_LEAVE");
        m.insert(0x008E, "CMSG_GUILD_REMOVE");
        m.insert(0x008F, "CMSG_GUILD_DISBAND");
        m.insert(0x0090, "CMSG_GUILD_LEADER");
        m.insert(0x0091, "CMSG_GUILD_MOTD");
        m.insert(0x0092, "SMSG_GUILD_EVENT");
        m.insert(0x0093, "SMSG_GUILD_COMMAND_RESULT");
        m.insert(0x0231, "CMSG_GUILD_RANK");
        m.insert(0x0232, "CMSG_GUILD_ADD_RANK");
        m.insert(0x0233, "CMSG_GUILD_DEL_RANK");
        m.insert(0x0234, "CMSG_GUILD_SET_PUBLIC_NOTE");
        m.insert(0x0235, "CMSG_GUILD_SET_OFFICER_NOTE");
        m.insert(0x02FC, "CMSG_GUILD_INFO_TEXT");
        m.insert(0x01F1, "MSG_SAVE_GUILD_EMBLEM");

        // Petition / Charter
        m.insert(0x01BB, "CMSG_PETITION_SHOWLIST");
        m.insert(0x01BC, "SMSG_PETITION_SHOWLIST");
        m.insert(0x01BD, "CMSG_PETITION_BUY");
        m.insert(0x01BE, "CMSG_PETITION_SHOW_SIGNATURES");
        m.insert(0x01BF, "SMSG_PETITION_SHOW_SIGNATURES");
        m.insert(0x01C0, "CMSG_PETITION_SIGN");
        m.insert(0x01C1, "SMSG_PETITION_SIGN_RESULTS");
        m.insert(0x01C2, "MSG_PETITION_DECLINE");
        m.insert(0x01C3, "SMSG_PETITION_QUERY_RESPONSE");
        m.insert(0x01C4, "CMSG_TURN_IN_PETITION");
        m.insert(0x01C5, "SMSG_TURN_IN_PETITION_RESULTS");
        m.insert(0x01C7, "CMSG_OFFER_PETITION");
        m.insert(0x02C1, "MSG_PETITION_RENAME");

        // Mail
        m.insert(0x0284, "MSG_QUERY_NEXT_MAIL_TIME");
        m.insert(0x0238, "CMSG_SEND_MAIL");
        m.insert(0x0239, "SMSG_SEND_MAIL_RESULT");
        m.insert(0x023A, "CMSG_GET_MAIL_LIST");
        m.insert(0x023B, "SMSG_MAIL_LIST_RESULT");
        m.insert(0x0245, "CMSG_MAIL_TAKE_MONEY");
        m.insert(0x0246, "CMSG_MAIL_TAKE_ITEM");
        m.insert(0x0247, "CMSG_MAIL_MARK_AS_READ");
        m.insert(0x0248, "CMSG_MAIL_RETURN_TO_SENDER");
        m.insert(0x0249, "CMSG_MAIL_DELETE");
        m.insert(0x024A, "CMSG_MAIL_CREATE_TEXT_ITEM");
        m.insert(0x0285, "SMSG_RECEIVED_MAIL");

        // Auction House
        m.insert(0x0255, "MSG_AUCTION_HELLO");
        m.insert(0x0256, "CMSG_AUCTION_SELL_ITEM");
        m.insert(0x0257, "CMSG_AUCTION_REMOVE_ITEM");
        m.insert(0x0258, "CMSG_AUCTION_LIST_ITEMS");
        m.insert(0x0259, "CMSG_AUCTION_LIST_OWNER_ITEMS");
        m.insert(0x025A, "CMSG_AUCTION_PLACE_BID");
        m.insert(0x025B, "SMSG_AUCTION_COMMAND_RESULT");
        m.insert(0x025C, "SMSG_AUCTION_LIST_RESULT");
        m.insert(0x025D, "SMSG_AUCTION_OWNER_LIST_RESULT");
        m.insert(0x025E, "SMSG_AUCTION_BIDDER_NOTIFICATION");
        m.insert(0x025F, "SMSG_AUCTION_OWNER_NOTIFICATION");
        m.insert(0x0264, "CMSG_AUCTION_LIST_BIDDER_ITEMS");
        m.insert(0x0265, "SMSG_AUCTION_BIDDER_LIST_RESULT");
        m.insert(0x028D, "SMSG_AUCTION_REMOVED_NOTIFICATION");

        // Battleground
        m.insert(0x02D3, "CMSG_BATTLEFIELD_STATUS");
        m.insert(0x02D4, "SMSG_BATTLEFIELD_STATUS");
        m.insert(0x023C, "SMSG_BATTLEFIELD_LIST");
        m.insert(0x023E, "CMSG_BATTLEFIELD_JOIN");
        m.insert(0x02E1, "SMSG_BATTLEFIELD_JOINED");
        m.insert(0x02E5, "CMSG_LEAVE_BATTLEFIELD");
        m.insert(0x02D5, "CMSG_BATTLEFIELD_PORT");
        m.insert(0x02D7, "CMSG_BATTLEMASTER_HELLO");
        m.insert(0x02E3, "CMSG_AREA_SPIRIT_HEALER_QUEUE");
        m.insert(0x02E2, "CMSG_AREA_SPIRIT_HEALER_QUERY");

        // Instance & Raid
        m.insert(0x02CD, "CMSG_REQUEST_RAID_INFO");
        m.insert(0x02CC, "SMSG_RAID_INSTANCE_INFO");
        m.insert(0x031D, "CMSG_RESET_INSTANCES");
        m.insert(0x031E, "SMSG_INSTANCE_RESET");
        m.insert(0x031F, "SMSG_INSTANCE_RESET_FAILED");

        // Meeting Stone
        m.insert(0x0296, "CMSG_MEETINGSTONE_INFO");
        m.insert(0x0292, "CMSG_MEETINGSTONE_JOIN");
        m.insert(0x0293, "CMSG_MEETINGSTONE_LEAVE");
        m.insert(0x0294, "CMSG_MEETINGSTONE_CHEAT");
        m.insert(0x0295, "SMSG_MEETINGSTONE_SETQUEUE");

        // Duel
        m.insert(0x016C, "CMSG_DUEL_ACCEPTED");
        m.insert(0x016D, "CMSG_DUEL_CANCELLED");
        m.insert(0x0167, "SMSG_DUEL_REQUESTED");
        m.insert(0x02B7, "SMSG_DUEL_COUNTDOWN");
        m.insert(0x0168, "SMSG_DUEL_OUTOFBOUNDS");
        m.insert(0x0169, "SMSG_DUEL_INBOUNDS");
        m.insert(0x016A, "SMSG_DUEL_COMPLETE");
        m.insert(0x016B, "SMSG_DUEL_WINNER");

        // Pet
        m.insert(0x0052, "CMSG_PET_NAME_QUERY");
        m.insert(0x0053, "SMSG_PET_NAME_QUERY_RESPONSE");
        m.insert(0x0174, "CMSG_PET_SET_ACTION");
        m.insert(0x0175, "CMSG_PET_ACTION");
        m.insert(0x0176, "CMSG_PET_ABANDON");
        m.insert(0x0177, "CMSG_PET_RENAME");
        m.insert(0x0179, "SMSG_PET_SPELLS");
        m.insert(0x017A, "SMSG_PET_MODE");
        m.insert(0x0173, "SMSG_PET_TAME_FAILURE");
        m.insert(0x0178, "SMSG_PET_NAME_INVALID");
        m.insert(0x01F0, "CMSG_PET_CAST_SPELL");
        m.insert(0x0138, "SMSG_PET_CAST_FAILED");
        m.insert(0x026B, "CMSG_PET_CANCEL_AURA");
        m.insert(0x02C6, "SMSG_PET_ACTION_FEEDBACK");
        m.insert(0x02F0, "CMSG_PET_UNLEARN");
        m.insert(0x02F1, "SMSG_PET_UNLEARN_CONFIRM");
        m.insert(0x02F3, "CMSG_PET_SPELL_AUTOCAST");
        m.insert(0x02EA, "CMSG_PET_STOP_ATTACK");
        m.insert(0x0279, "CMSG_REQUEST_PET_INFO");

        // Pet Stable
        m.insert(0x026E, "MSG_LIST_STABLED_PETS");
        m.insert(0x026F, "CMSG_STABLE_PET");
        m.insert(0x0270, "CMSG_UNSTABLE_PET");
        m.insert(0x0272, "CMSG_BUY_STABLE_SLOT");
        m.insert(0x0273, "SMSG_STABLE_RESULT");
        m.insert(0x0274, "CMSG_STABLE_REVIVE_PET");
        m.insert(0x0275, "CMSG_STABLE_SWAP_PET");

        // GM Ticket
        m.insert(0x0205, "CMSG_GMTICKET_CREATE");
        m.insert(0x0206, "SMSG_GMTICKET_CREATE");
        m.insert(0x0207, "CMSG_GMTICKET_UPDATETEXT");
        m.insert(0x0208, "SMSG_GMTICKET_UPDATETEXT");
        m.insert(0x0211, "CMSG_GMTICKET_GETTICKET");
        m.insert(0x0212, "SMSG_GMTICKET_GETTICKET");
        m.insert(0x0217, "CMSG_GMTICKET_DELETETICKET");
        m.insert(0x0218, "SMSG_GMTICKET_DELETETICKET");
        m.insert(0x021A, "CMSG_GMTICKET_SYSTEMSTATUS");
        m.insert(0x021B, "SMSG_GMTICKET_SYSTEMSTATUS");
        m.insert(0x032A, "CMSG_GMSURVEY_SUBMIT");

        // PvP
        m.insert(0x0253, "CMSG_TOGGLE_PVP");

        // Summon
        m.insert(0x02AB, "SMSG_SUMMON_REQUEST");
        m.insert(0x02AC, "CMSG_SUMMON_RESPONSE");

        // Far Sight
        m.insert(0x027A, "CMSG_FAR_SIGHT");

        // Appearance
        m.insert(0x02B9, "CMSG_TOGGLE_HELM");
        m.insert(0x02BA, "CMSG_TOGGLE_CLOAK");

        // Player Misc
        m.insert(0x0153, "CMSG_SAVE_PLAYER");
        m.insert(0x01E0, "CMSG_SETSHEATHED");
        m.insert(0x01CC, "CMSG_PLAYED_TIME");
        m.insert(0x01CD, "SMSG_PLAYED_TIME");
        m.insert(0x01CA, "CMSG_BUG");

        // Warden (Anticheat)
        m.insert(0x02E7, "CMSG_WARDEN_DATA");
        m.insert(0x02E6, "SMSG_WARDEN_DATA");

        // Weather
        m.insert(0x02F4, "SMSG_WEATHER");

        m
    });
    map.get(&opcode).copied().unwrap_or("UNKNOWN")
}

fn tbc_opcode_name(opcode: u32) -> &'static str {
    static MAP: OnceLock<HashMap<u32, &'static str>> = OnceLock::new();
    let map = MAP.get_or_init(|| {
        let mut m = HashMap::new();

        // Auth
        m.insert(0x1EE, "CMSG_AUTH_SESSION");
        m.insert(0x1EF, "SMSG_AUTH_RESPONSE");
        m.insert(0x1EC, "SMSG_AUTH_CHALLENGE");

        // Character
        m.insert(0x0037, "CMSG_CHAR_ENUM");
        m.insert(0x003B, "SMSG_CHAR_ENUM");
        m.insert(0x003D, "CMSG_PLAYER_LOGIN");

        // Movement
        m.insert(0x00B5, "MSG_MOVE_START_FORWARD");
        m.insert(0x00B6, "MSG_MOVE_START_BACKWARD");
        m.insert(0x00B7, "MSG_MOVE_STOP");
        m.insert(0x00BB, "MSG_MOVE_JUMP");
        m.insert(0x00EE, "MSG_MOVE_HEARTBEAT");

        // Chat
        m.insert(0x0095, "CMSG_MESSAGECHAT");
        m.insert(0x0096, "SMSG_MESSAGECHAT");

        // Spell
        m.insert(0x012E, "CMSG_CAST_SPELL");
        m.insert(0x0130, "SMSG_SPELL_START");
        m.insert(0x0131, "SMSG_SPELL_GO");

        // Combat
        m.insert(0x01B2, "SMSG_ATTACKSTART");
        m.insert(0x01B3, "SMSG_ATTACKSTOP");
        m.insert(0x0141, "CMSG_ATTACKSWING");

        // Update
        m.insert(0x00A9, "SMSG_UPDATE_OBJECT");
        m.insert(0x00A8, "SMSG_COMPRESSED_UPDATE_OBJECT");

        // Query
        m.insert(0x0050, "CMSG_NAME_QUERY");
        m.insert(0x0051, "SMSG_NAME_QUERY_RESPONSE");

        // Misc
        m.insert(0x001C, "SMSG_PONG");
        m.insert(0x01DC, "CMSG_PING");
        m.insert(0x006C, "SMSG_DESTROY_OBJECT");

        // Logout
        m.insert(0x004B, "CMSG_PLAYER_LOGOUT");
        m.insert(0x004C, "SMSG_LOGOUT_RESPONSE");
        m.insert(0x004E, "SMSG_LOGOUT_COMPLETE");

        m
    });
    map.get(&opcode).copied().unwrap_or("UNKNOWN")
}

fn cata_opcode_name(opcode: u32) -> &'static str {
    static MAP: OnceLock<HashMap<u32, &'static str>> = OnceLock::new();
    let map = MAP.get_or_init(|| {
        let mut m = HashMap::new();

        // Cataclysm (4.3.4 build 15595) - opcodes are reshuffled
        m.insert(0x6726, "CMSG_AUTH_SESSION");
        m.insert(0x40A9, "SMSG_AUTH_RESPONSE");
        m.insert(0x4542, "SMSG_AUTH_CHALLENGE");
        m.insert(0x2340, "CMSG_CHAR_ENUM");
        m.insert(0x6362, "SMSG_CHAR_ENUM");
        m.insert(0x0725, "CMSG_PLAYER_LOGIN");
        m.insert(0x2061, "CMSG_MESSAGECHAT");
        m.insert(0x6120, "SMSG_MESSAGECHAT");
        m.insert(0x0264, "CMSG_CAST_SPELL");
        m.insert(0x2504, "SMSG_SPELL_START");
        m.insert(0x4305, "SMSG_SPELL_GO");
        m.insert(0x0160, "SMSG_UPDATE_OBJECT");
        m.insert(0x001C, "SMSG_PONG");
        m.insert(0x01DC, "CMSG_PING");
        m.insert(0x6700, "CMSG_NAME_QUERY");
        m.insert(0x4701, "SMSG_NAME_QUERY_RESPONSE");
        m.insert(0x0344, "CMSG_PLAYER_LOGOUT");
        m.insert(0x2165, "SMSG_LOGOUT_RESPONSE");
        m.insert(0x4066, "SMSG_LOGOUT_COMPLETE");

        m
    });
    map.get(&opcode).copied().unwrap_or("UNKNOWN")
}
