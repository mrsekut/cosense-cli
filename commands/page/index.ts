import type { ParsedArgs } from '../../lib/args.ts';
import { output, error } from '../../lib/output.ts';
import { pageGet } from './get.ts';
import { pageList } from './list.ts';
import { pageSearch } from './search.ts';
import { pageCreate } from './create.ts';
import { pageAppend } from './append.ts';

export async function pageCommand(parsed: ParsedArgs): Promise<void> {
  const subcommand = parsed.positionals[1];

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
      output(
        error(
          'UNKNOWN_SUBCOMMAND',
          'Usage: cosense page <get|list|search|create|append>',
        ),
      );
  }
}
