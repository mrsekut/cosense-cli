import type { ParsedArgs } from '../../lib/args.ts';
import { getString, getNumber } from '../../lib/args.ts';
import { output, success, error } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { fetchPageList } from '../../lib/cosense.ts';

export async function pageList(parsed: ParsedArgs): Promise<void> {
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
