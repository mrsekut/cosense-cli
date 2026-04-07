import type { ParsedArgs } from '../../args.ts';
import { pageGet } from './get.ts';
import { pageList } from './list.ts';
import { pageSearch } from './search.ts';
import { pageCreate } from './create.ts';
import { pageAppend } from './append.ts';

const HELP = `cosense page - Page operations

Usage: cosense page <subcommand> [options]

Subcommands:
  get <title>       Fetch a single page by title
  list              List pages in a project
  search <query>    Full-text search across pages
  create <title>    Create a new page
  append <title>    Append lines to an existing page

All subcommands require --project <name>.
Run "cosense page <subcommand> --help" for subcommand-specific help.
`;

export async function pageCommand(parsed: ParsedArgs): Promise<void> {
  const subcommand = parsed.positionals[1];

  if (!subcommand) {
    console.log(HELP);
    process.exit(0);
  }

  // --help without a recognized subcommand shows page-level help
  if (
    parsed.values['help'] === true &&
    !['get', 'list', 'search', 'create', 'append'].includes(subcommand)
  ) {
    console.log(HELP);
    process.exit(0);
  }

  switch (subcommand) {
    case 'get':
      await pageGet(parsed);
      break;
    case 'list':
      await pageList(parsed);
      break;
    case 'search':
      await pageSearch(parsed);
      break;
    case 'create':
      await pageCreate(parsed);
      break;
    case 'append':
      await pageAppend(parsed);
      break;
    default:
      console.log(HELP);
      process.exit(1);
  }
}
