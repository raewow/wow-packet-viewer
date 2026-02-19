import { PacketDefinition } from "./definitions";
import { vanillaDefinitions } from "./expansions/vanilla";

type RegistryKey = string;

function makeKey(
  build: number,
  opcode: number,
  direction: string
): RegistryKey {
  return `${build}:${direction}:${opcode}`;
}

const registry = new Map<RegistryKey, PacketDefinition>();

function registerDefinitions(build: number, defs: PacketDefinition[]) {
  for (const def of defs) {
    registry.set(makeKey(build, def.opcode, def.direction), def);
  }
}

// Register all known definitions
registerDefinitions(5875, vanillaDefinitions);

/** Look up a packet definition. Returns undefined if no mapper exists. */
export function getPacketDefinition(
  build: number,
  opcode: number,
  direction: string
): PacketDefinition | undefined {
  return registry.get(makeKey(build, opcode, direction));
}
