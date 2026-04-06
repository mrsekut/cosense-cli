#!/usr/bin/env bun

import { parseArgs, getString } from './lib/args.ts';
import { output, error, type Format } from './lib/output.ts';
import { configCommand } from './commands/config.ts';
import { pageCommand } from './commands/page/index.ts';
import { exportCommand } from './commands/export.ts';
import { linksCommand } from './commands/links.ts';

const HELP = `cosense-cli - Cosense CLI for AI agents

Usage: cosense <command> [options]

Commands:
  config    Manage profiles (set-profile, list-profiles, remove-profile)
  page      Page operations (get, list, search, create, append)
  export    Export pages for AI consumption
  links     Explore page link structure

Global Options:
  --profile <name>      Profile to use (default: "default")
  --project <name>      Project name (overrides profile default)
  --format <json|text>  Output format (default: json)
  --help                Show help
`;

async function main() {
  const parsed = parseArgs(Bun.argv);
  const format = (getString(parsed.values, 'format') ?? 'json') as Format;
  const command = parsed.positionals[0];

  if (!command || parsed.values['help'] === true) {
    console.log(HELP);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'config':
        await configCommand(parsed);
        break;
      case 'page':
        await pageCommand(parsed, format);
        break;
      case 'export':
        await exportCommand(parsed, format);
        break;
      case 'links':
        await linksCommand(parsed, format);
        break;
      default:
        output(error('UNKNOWN_COMMAND', `Unknown command: ${command}`), format);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    output(error('ERROR', msg), format);
  }
}

main();
