import type { ParsedArgs } from '../lib/args.ts';
import { getString, getNumber, getBool } from '../lib/args.ts';
import type { Format } from '../lib/output.ts';
import { output, success, error } from '../lib/output.ts';
import { resolveOptions } from '../lib/config.ts';
import { fetchPage, fetchPageList } from '../lib/cosense.ts';

export async function exportCommand(
  parsed: ParsedArgs,
  format: Format,
): Promise<void> {
  const opts = await resolveOptions({
    profile: getString(parsed.flags, 'profile'),
    project: getString(parsed.flags, 'project'),
  });

  const depth = getNumber(parsed.flags, 'depth') ?? 1;

  if (getBool(parsed.flags, 'all')) {
    await exportAll(opts.project, opts.sid, format);
    return;
  }

  const title = parsed.commands[1];
  if (!title) {
    output(
      error(
        'MISSING_ARGUMENT',
        'Usage: cosense export <title> [--depth 1|2] or cosense export --all',
      ),
      format,
    );
    return;
  }

  const page = await fetchPage(opts.project, title, opts.sid);

  const pages: Array<{ title: string; lines: string[] }> = [
    { title: page.title, lines: page.lines },
  ];

  if (depth >= 1 && page.relatedPages) {
    const oneHopLinks = page.relatedPages.links1hop ?? [];
    for (const linked of oneHopLinks) {
      try {
        const linkedPage = await fetchPage(
          opts.project,
          linked.title,
          opts.sid,
        );
        pages.push({ title: linkedPage.title, lines: linkedPage.lines });
      } catch {
        // skip pages that can't be fetched
      }
    }
  }

  if (depth >= 2 && page.relatedPages) {
    const twoHopLinks = page.relatedPages.links2hop ?? [];
    const seen = new Set(pages.map(p => p.title));
    for (const linked of twoHopLinks) {
      if (seen.has(linked.title)) continue;
      try {
        const linkedPage = await fetchPage(
          opts.project,
          linked.title,
          opts.sid,
        );
        pages.push({ title: linkedPage.title, lines: linkedPage.lines });
        seen.add(linked.title);
      } catch {
        // skip
      }
    }
  }

  if (format === 'text') {
    const text = pages
      .map(p => `=== ${p.title} ===\n${p.lines.join('\n')}`)
      .join('\n\n');
    console.log(text);
  } else {
    output(success({ pages }), format);
  }
}

async function exportAll(
  project: string,
  sid: string | undefined,
  format: Format,
): Promise<void> {
  const result = await fetchPageList(project, { limit: 1000, sid });
  const pages: Array<{ title: string; lines: string[] }> = [];

  for (const pageSummary of result.pages) {
    try {
      const page = await fetchPage(project, pageSummary.title, sid);
      pages.push({ title: page.title, lines: page.lines });
    } catch {
      // skip
    }
  }

  if (format === 'text') {
    const text = pages
      .map(p => `=== ${p.title} ===\n${p.lines.join('\n')}`)
      .join('\n\n');
    console.log(text);
  } else {
    output(success({ count: pages.length, pages }), format);
  }
}
