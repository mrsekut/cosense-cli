import type { ParsedArgs } from '../../lib/args.ts';
import { getString, getNumber } from '../../lib/args.ts';
import type { Format } from '../../lib/output.ts';
import { output, success } from '../../lib/output.ts';
import { resolveOptions } from '../../lib/config.ts';
import { fetchPageList } from '../../lib/cosense.ts';

export async function pageList(
  parsed: ParsedArgs,
  format: Format,
): Promise<void> {
  const opts = await resolveOptions({
    profile: getString(parsed.values, 'profile'),
    project: getString(parsed.values, 'project'),
  });

  const data = await fetchPageList(opts.project, {
    sort: getString(parsed.values, 'sort'),
    limit: getNumber(parsed.values, 'limit'),
    skip: getNumber(parsed.values, 'skip'),
    sid: opts.sid,
  });

  output(success(data), format);
}
