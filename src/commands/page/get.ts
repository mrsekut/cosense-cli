import type { ParsedArgs } from '../../args.ts';
import { getString, showHelp } from '../../args.ts';
import { output, success, error } from '../../output.ts';
import { resolveOptions } from '../../config.ts';
import { fetchPage } from '../../cosense.ts';

const HELP = `cosense page get - Fetch a single page by title

Usage: cosense page get <title> --project <name>

Options:
  --project <name>   Project name (required)

Example:
  cosense page get "My Page" --project my-wiki

Output:
  {"ok": true, "data": {"title": "...", "lines": ["..."], "links": ["..."], "descriptions": ["..."]}}
`;

export async function pageGet(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);
  const title = parsed.positionals[2];
  if (!title) {
    output(error('MISSING_ARGUMENT', 'Usage: cosense page get <title>'));
    return;
  }

  const project = getString(parsed.values, 'project');
  if (!project) {
    output(error('MISSING_ARGUMENT', '--project is required'));
    return;
  }
  const opts = await resolveOptions({ project });

  const page = await fetchPage(opts.project, title, opts.sid);
  output(success(page));
}
