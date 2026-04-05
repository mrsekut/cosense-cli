export interface ParsedArgs {
  commands: string[];
  flags: Record<string, string | true>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const commands: string[] = [];
  const flags: Record<string, string | true> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      commands.push(arg);
    }
  }

  return { commands, flags };
}

export function getString(flags: Record<string, string | true>, key: string): string | undefined {
  const val = flags[key];
  return typeof val === "string" ? val : undefined;
}

export function getNumber(flags: Record<string, string | true>, key: string): number | undefined {
  const val = getString(flags, key);
  return val !== undefined ? Number(val) : undefined;
}

export function getBool(flags: Record<string, string | true>, key: string): boolean {
  return flags[key] !== undefined;
}
