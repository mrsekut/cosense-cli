import type { ParsedArgs } from '../../lib/args.ts';
import { getString } from '../../lib/args.ts';
import type { Format } from '../../lib/output.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { fetchPage } from '../../lib/cosense.ts';

export async function pageGet(
  parsed: ParsedArgs,
  format: Format,
): Promise<void> {
  const title = parsed.positionals[2];
  if (!title) {
    output(
      error('MISSING_ARGUMENT', 'Usage: cosense page get <title>'),
      format,
    );
    return;
  }

  const opts = await resolveOptions({
    profile: getString(parsed.values, 'profile'),
    project: getString(parsed.values, 'project'),
  });

  const page = await fetchPage(opts.project, title, opts.sid);
  output(success(page), format);
}
