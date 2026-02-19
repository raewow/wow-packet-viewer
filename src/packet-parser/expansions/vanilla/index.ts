import { PacketDefinition } from "../../definitions";
import { characterDefinitions } from "./character";
import { updateObjectDefinitions } from "./updateObject";
import { movementDefinitions } from "./movement";
import { loginLogoutDefinitions } from "./loginLogout";
import { socialDefinitions } from "./social";
import { spellDefinitions } from "./spell";
import { factionDefinitions } from "./faction";
import { chatDefinitions } from "./chat";
import { queriesDefinitions } from "./queries";
import { worldDefinitions } from "./world";
import { raidDefinitions } from "./raid";
import { mailDefinitions } from "./mail";
import { miscDefinitions } from "./misc";
import { combatDefinitions } from "./combat";
import { spellCastDefinitions } from "./spellCast";
import { spellDamageDefinitions } from "./spellDamage";
import { spellLogDefinitions } from "./spellLog";
import { auraDefinitions } from "./aura";
import { cinematicDefinitions } from "./cinematic";
import { lootDefinitions } from "./loot";
import { questDefinitions } from "./quest";
import { gossipDefinitions } from "./gossip";
import { experienceDefinitions } from "./experience";

export const vanillaDefinitions: PacketDefinition[] = [
  ...characterDefinitions,
  ...updateObjectDefinitions,
  ...movementDefinitions,
  ...loginLogoutDefinitions,
  ...socialDefinitions,
  ...spellDefinitions,
  ...factionDefinitions,
  ...chatDefinitions,
  ...queriesDefinitions,
  ...worldDefinitions,
  ...raidDefinitions,
  ...mailDefinitions,
  ...miscDefinitions,
  ...combatDefinitions,
  ...spellCastDefinitions,
  ...spellDamageDefinitions,
  ...spellLogDefinitions,
  ...auraDefinitions,
  ...cinematicDefinitions,
  ...lootDefinitions,
  ...questDefinitions,
  ...gossipDefinitions,
  ...experienceDefinitions,
];
