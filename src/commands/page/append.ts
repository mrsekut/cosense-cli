import type { ParsedArgs } from '../../args.ts';
import { getString, getBool, showHelp } from '../../args.ts';
import { output, success, error } from '../../output.ts';
import { resolveOptions } from '../../config.ts';
import { appendLines } from '../../cosense.ts';
import { markdownToScrapbox } from '../../markdown.ts';

const HELP = `cosense page append - Append lines to an existing page

Usage: cosense page append <title> --project <name> [options]

Options:
  --project <name>          Project name (required)
  --body <text>             Text to append
  --body-stdin              Read body from stdin
  --input-format <format>   Input format: "md" (default) or "scrapbox"
  --after <text>            Insert after the line matching this text

Body is converted from Markdown to Scrapbox format by default.

Examples:
  cosense page append "My Page" --project my-wiki --body "New content"
  echo "More text" | cosense page append "My Page" --project my-wiki --body-stdin
  cosense page append "My Page" --project my-wiki --body "Inserted" --after "Section Title"

Output:
  {"ok": true, "data": {"title": "My Page", ...}}
`;

export async function pageAppend(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);
  const title = parsed.positionals[2];
  if (!title) {
    output(
      error(
        'MISSING_ARGUMENT',
        'Usage: cosense page append <title> --body <text>',
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
  if (opts.readonly) {
    output(error('READONLY_PROJECT', `Project "${project}" is read-only`));
    return;
  }

  const rawBody = getBool(parsed.values, 'body-stdin')
    ? await Bun.stdin.text()
    : (getString(parsed.values, 'body') ?? '');

  const inputFormat = getString(parsed.values, 'input-format') ?? 'md';
  const body =
    inputFormat === 'md' && rawBody
      ? await markdownToScrapbox(rawBody)
      : rawBody;

  const lines = body.split('\n');
  const data = await appendLines(opts.project, title, lines, {
    after: getString(parsed.values, 'after'),
    sid: opts.sid,
  });
  const url = `https://scrapbox.io/${encodeURIComponent(opts.project)}/${encodeURIComponent(title)}`;
  output(success({ title, url, ...data }));
}
