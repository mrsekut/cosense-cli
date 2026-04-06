import type { ParsedArgs } from '../../lib/args.ts';
import { getString, getBool, showHelp } from '../../lib/args.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { createPage } from '../../lib/cosense.ts';
import { markdownToScrapbox } from '../../lib/markdown.ts';

const HELP = `cosense page create - Create a new page

Usage: cosense page create <title> --project <name> [options]

Options:
  --project <name>          Project name (required)
  --body <text>             Page body text
  --body-stdin              Read body from stdin
  --input-format <format>   Input format: "md" (default) or "scrapbox"

Body is converted from Markdown to Scrapbox format by default.

Examples:
  cosense page create "New Page" --project my-wiki --body "# Hello"
  echo "# Hello" | cosense page create "New Page" --project my-wiki --body-stdin
  cosense page create "New Page" --project my-wiki --body "[link]" --input-format scrapbox

Output:
  {"ok": true, "data": {"title": "New Page", ...}}
`;

export async function pageCreate(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);
  const title = parsed.positionals[2];
  if (!title) {
    output(
      error(
        'MISSING_ARGUMENT',
        'Usage: cosense page create <title> --body <text> | --body-stdin',
      ),
    );
    return;
  }

  const project = getString(parsed.values, 'project');
  if (!project) {
    output(error('MISSING_ARGUMENT', '--project is required'));
    return;
  }
  const opts = await resolveOptions({ project });

  const rawBody = getBool(parsed.values, 'body-stdin')
    ? await Bun.stdin.text()
    : (getString(parsed.values, 'body') ?? '');

  const inputFormat = getString(parsed.values, 'input-format') ?? 'md';
  const body =
    inputFormat === 'md' && rawBody
      ? await markdownToScrapbox(rawBody)
      : rawBody;

  const lines = body ? body.split('\n') : [];
  const data = await createPage(opts.project, title, lines, opts.sid);
  const url = `https://scrapbox.io/${encodeURIComponent(opts.project)}/${encodeURIComponent(title)}`;
  output(success({ title, url, ...data }));
}
