import type { ParsedArgs } from '../../lib/args.ts';
import { getString, getBool } from '../../lib/args.ts';
import type { Format } from '../../lib/output.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { createPage } from '../../lib/cosense.ts';
import { markdownToScrapbox } from '../../lib/markdown.ts';

export async function pageCreate(
  parsed: ParsedArgs,
  format: Format,
): Promise<void> {
  const title = parsed.commands[2];
  if (!title) {
    output(
      error(
        'MISSING_ARGUMENT',
        'Usage: cosense page create <title> --body <text> | --body-stdin',
      ),
      format,
    );
    return;
  }

  const opts = await resolveOptions({
    profile: getString(parsed.flags, 'profile'),
    project: getString(parsed.flags, 'project'),
  });

  let body = getString(parsed.flags, 'body') ?? '';

  if (getBool(parsed.flags, 'body-stdin')) {
    body = await readStdin();
  }

  const inputFormat = getString(parsed.flags, 'input-format') ?? 'md';
  if (inputFormat === 'md' && body) {
    body = await markdownToScrapbox(body);
  }

  const lines = body ? body.split('\n') : [];
  const data = await createPage(opts.project, title, lines, opts.sid);
  output(success({ title, ...data }), format);
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
