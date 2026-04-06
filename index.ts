#!/usr/bin/env bun

import { parseArgs } from './lib/args.ts';
import { output, error } from './lib/output.ts';
import { profileCommand } from './commands/profile.ts';
import { pageCommand } from './commands/page/index.ts';
import { exportCommand } from './commands/export.ts';

const HELP = `cosense-cli - Cosense CLI for AI agents

Usage: cosense <command> [options]

Commands:
  profile   Manage profiles (set, list, remove)
  page      Page operations (get, list, search, create, append)
  export    Export pages for AI consumption

Global Options:
  --profile <name>      Profile to use (default: "default")
  --project <name>      Project name (overrides profile default)
  --help                Show help
`;

async function main() {
  const parsed = parseArgs(Bun.argv);
  const command = parsed.positionals[0];

  if (!command || parsed.values['help'] === true) {
    console.log(HELP);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'profile':
        await profileCommand(parsed);
        break;
      case 'page':
        await pageCommand(parsed);
        break;
      case 'export':
        await exportCommand(parsed);
        break;
      default:
        output(error('UNKNOWN_COMMAND', `Unknown command: ${command}`));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    output(error('ERROR', msg));
  }
}

main();
