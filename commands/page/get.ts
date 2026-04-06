import type { ParsedArgs } from '../../lib/args.ts';
import { getString } from '../../lib/args.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { fetchPage } from '../../lib/cosense.ts';

export async function pageGet(parsed: ParsedArgs): Promise<void> {
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
