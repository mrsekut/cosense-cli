#!/usr/bin/env bun

import { parseArgs } from './args.ts';
import { output, error } from './output.ts';
import { profileCommand } from './commands/profile.ts';
import { projectCommand } from './commands/project.ts';
import { pageCommand } from './commands/page/index.ts';
import { searchCommand } from './commands/search.ts';

const HELP = `cosense-cli - Cosense CLI for AI agents

Usage: cosense <command> [options]

Commands:
  profile   Manage profiles (set, list, remove)
  project   Manage projects (add, list, remove)
  page      Page operations (get, list, create, append)
  search    Search pages and fetch their content

Global Options:
  --project <name>      Project name (required for page/search commands)
  --help                Show help
`;

async function main() {
  const parsed = parseArgs(Bun.argv);
  const command = parsed.positionals[0];

  if (!command) {
    console.log(HELP);
    process.exit(0);
  }

  if (
    parsed.values['help'] === true &&
    !['profile', 'project', 'page', 'search'].includes(command)
  ) {
    console.log(HELP);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'profile':
        await profileCommand(parsed);
        break;
      case 'project':
        await projectCommand(parsed);
        break;
      case 'page':
        await pageCommand(parsed);
        break;
      case 'search':
        await searchCommand(parsed);
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
