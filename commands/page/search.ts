import type { ParsedArgs } from '../../lib/args.ts';
import { getString, showHelp } from '../../lib/args.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { searchPages } from '../../lib/cosense.ts';

const HELP = `cosense page search - Full-text search across pages

Usage: cosense page search <query> --project <name>

Options:
  --project <name>   Project name (required)

The query can be multiple words (they will be joined with spaces).

Examples:
  cosense page search "TypeScript" --project my-wiki
  cosense page search hello world --project my-wiki

Output:
  {"ok": true, "data": {"pages": [{"title": "...", "words": ["..."]}]}}
`;

export async function pageSearch(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);
  const query = parsed.positionals.slice(2).join(' ');
  if (!query) {
    output(error('MISSING_ARGUMENT', 'Usage: cosense page search <query>'));
    return;
  }

  const project = getString(parsed.values, 'project');
  if (!project) {
    output(error('MISSING_ARGUMENT', '--project is required'));
    return;
  }
  const opts = await resolveOptions({ project });

  const data = await searchPages(opts.project, query, opts.sid);
  output(success(data));
}
