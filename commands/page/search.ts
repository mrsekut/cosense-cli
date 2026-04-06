import type { ParsedArgs } from '../../lib/args.ts';
import { getString } from '../../lib/args.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { searchPages } from '../../lib/cosense.ts';

export async function pageSearch(parsed: ParsedArgs): Promise<void> {
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
