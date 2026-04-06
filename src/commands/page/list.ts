import type { ParsedArgs } from '../../args.ts';
import { getString, getNumber, showHelp } from '../../args.ts';
import { output, success, error } from '../../output.ts';
import { resolveOptions } from '../../config.ts';
import { fetchPageList } from '../../cosense.ts';

const HELP = `cosense page list - List pages in a project

Usage: cosense page list --project <name> [options]

Options:
  --project <name>   Project name (required)
  --sort <field>     Sort field (e.g. "updated", "created", "title")
  --limit <n>        Maximum number of pages to return
  --skip <n>         Number of pages to skip (for pagination)

Examples:
  cosense page list --project my-wiki
  cosense page list --project my-wiki --sort updated --limit 10
  cosense page list --project my-wiki --limit 20 --skip 20

Output:
  {"ok": true, "data": {"count": 100, "pages": [{"title": "...", "updated": 1234567890}]}}
`;

export async function pageList(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);
  const project = getString(parsed.values, 'project');
  if (!project) {
    output(error('MISSING_ARGUMENT', '--project is required'));
    return;
  }
  const opts = await resolveOptions({ project });

  const data = await fetchPageList(opts.project, {
    sort: getString(parsed.values, 'sort'),
    limit: getNumber(parsed.values, 'limit'),
    skip: getNumber(parsed.values, 'skip'),
    sid: opts.sid,
  });

  output(success(data));
}
