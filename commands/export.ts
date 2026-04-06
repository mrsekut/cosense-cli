import type { ParsedArgs } from '../lib/args.ts';
import { getString, getNumber, getBool } from '../lib/args.ts';
import { output, success, error } from '../lib/output.ts';
import { resolveOptions } from '../lib/config.ts';
import { fetchPage, fetchPageList } from '../lib/cosense.ts';

type PageEntry = { title: string; lines: string[] };

const tryFetchPage = async (
  project: string,
  title: string,
  sid?: string,
): Promise<PageEntry | null> => {
  try {
    const page = await fetchPage(project, title, sid);
    return { title: page.title, lines: page.lines };
  } catch {
    return null;
  }
};

const compact = <T>(arr: (T | null)[]): T[] =>
  arr.filter((x): x is T => x !== null);

export async function exportCommand(parsed: ParsedArgs): Promise<void> {
  const opts = await resolveOptions({
    profile: getString(parsed.values, 'profile'),
    project: getString(parsed.values, 'project'),
  });

  const depth = getNumber(parsed.values, 'depth') ?? 1;

  if (getBool(parsed.values, 'all')) {
    await exportAll(opts.project, opts.sid);
    return;
  }

  const title = parsed.positionals[1];
  if (!title) {
    output(
      error(
        'MISSING_ARGUMENT',
        'Usage: cosense export <title> [--depth 1|2] or cosense export --all',
      ),
    );
    return;
  }

  const page = await fetchPage(opts.project, title, opts.sid);
  const rootPage: PageEntry = { title: page.title, lines: page.lines };

  const oneHopPages =
    depth >= 1 && page.relatedPages
      ? compact(
          await Promise.all(
            (page.relatedPages.links1hop ?? []).map(linked =>
              tryFetchPage(opts.project, linked.title, opts.sid),
            ),
          ),
        )
      : [];

  const seenTitles = new Set([
    rootPage.title,
    ...oneHopPages.map(p => p.title),
  ]);

  const twoHopPages =
    depth >= 2 && page.relatedPages
      ? compact(
          await Promise.all(
            (page.relatedPages.links2hop ?? [])
              .filter(linked => !seenTitles.has(linked.title))
              .map(linked =>
                tryFetchPage(opts.project, linked.title, opts.sid),
              ),
          ),
        )
      : [];

  const pages = [rootPage, ...oneHopPages, ...twoHopPages];
  output(success({ pages }));
}

async function exportAll(
  project: string,
  sid: string | undefined,
): Promise<void> {
  const result = await fetchPageList(project, { limit: 1000, sid });

  const pages = compact(
    await Promise.all(
      result.pages.map(pageSummary =>
        tryFetchPage(project, pageSummary.title, sid),
      ),
    ),
  );

  output(success({ count: pages.length, pages }));
}
