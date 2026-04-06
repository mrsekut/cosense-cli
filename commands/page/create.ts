import type { ParsedArgs } from '../../lib/args.ts';
import { getString, getBool } from '../../lib/args.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { createPage } from '../../lib/cosense.ts';
import { markdownToScrapbox } from '../../lib/markdown.ts';

export async function pageCreate(parsed: ParsedArgs): Promise<void> {
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

  const lines = body ? body.split('\n') : [];
  const data = await createPage(opts.project, title, lines, opts.sid);
  output(success({ title, ...data }));
}
