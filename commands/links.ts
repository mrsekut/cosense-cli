import type { ParsedArgs } from '../lib/args.ts';
import { getString, getNumber } from '../lib/args.ts';
import type { Format } from '../lib/output.ts';
import { output, success, error } from '../lib/output.ts';
import { resolveOptions } from '../lib/config.ts';
import { fetchPage } from '../lib/cosense.ts';

export async function linksCommand(
  parsed: ParsedArgs,
  format: Format,
): Promise<void> {
  const title = parsed.positionals[1];
  if (!title) {
    output(
      error('MISSING_ARGUMENT', 'Usage: cosense links <title> [--depth 1|2]'),
      format,
    );
    return;
  }

  const opts = await resolveOptions({
    profile: getString(parsed.values, 'profile'),
    project: getString(parsed.values, 'project'),
  });

  const depth = getNumber(parsed.values, 'depth') ?? 1;
  const page = await fetchPage(opts.project, title, opts.sid);

  const links = page.links ?? [];
  const oneHopLinks =
    page.relatedPages?.links1hop?.map((p: { title: string }) => p.title) ?? [];
  const twoHopLinks =
    depth >= 2
      ? (page.relatedPages?.links2hop?.map((p: { title: string }) => p.title) ??
        [])
      : [];

  output(
    success({
      title: page.title,
      links,
      relatedPages: oneHopLinks,
      ...(depth >= 2 ? { twoHopLinks } : {}),
    }),
    format,
  );
}
