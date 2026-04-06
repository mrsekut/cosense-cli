import type { ParsedArgs } from '../../lib/args.ts';
import { getString, getBool } from '../../lib/args.ts';
import type { Format } from '../../lib/output.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { appendLines } from '../../lib/cosense.ts';
import { markdownToScrapbox } from '../../lib/markdown.ts';

export async function pageAppend(
  parsed: ParsedArgs,
  format: Format,
): Promise<void> {
  const title = parsed.positionals[2];
  if (!title) {
    output(
      error(
        'MISSING_ARGUMENT',
        'Usage: cosense page append <title> --body <text>',
      ),
      format,
    );
    return;
  }

  const opts = await resolveOptions({
    profile: getString(parsed.values, 'profile'),
    project: getString(parsed.values, 'project'),
  });

  const rawBody = getBool(parsed.values, 'body-stdin')
    ? await Bun.stdin.text()
    : (getString(parsed.values, 'body') ?? '');

  const inputFormat = getString(parsed.values, 'input-format') ?? 'md';
  const body =
    inputFormat === 'md' && rawBody ? await markdownToScrapbox(rawBody) : rawBody;

  const lines = body.split('\n');
  const data = await appendLines(opts.project, title, lines, {
    after: getString(parsed.values, 'after'),
    sid: opts.sid,
  });
  output(success({ title, ...data }), format);
}
