import type { ParsedArgs } from '../../args.ts';
import { getString, getNumber, showHelp } from '../../args.ts';
import { output, success, error } from '../../output.ts';
import { resolveOptions } from '../../config.ts';
import { fetchPage } from '../../cosense.ts';

const HELP = `cosense page get - Fetch a single page by title

Usage: cosense page get <title> --project <name> [options]

Options:
  --project <name>   Project name (required)
  --depth <0|1|2>    Link follow depth (default: 0)
                       0 = single page only
                       1 = + 1-hop linked pages
                       2 = + 1-hop + 2-hop linked pages

Examples:
  cosense page get "My Page" --project my-wiki
  cosense page get "My Page" --project my-wiki --depth 1

Output:
  {"ok": true, "data": {"title": "...", "lines": ["..."], "links": ["..."], "descriptions": ["..."]}}
  With --depth: {"ok": true, "data": {"pages": [{"title": "...", "lines": ["..."]}]}}
`;

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

export async function pageGet(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);
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
  const depth = getNumber(parsed.values, 'depth') ?? 0;

  const page = await fetchPage(opts.project, title, opts.sid);

  if (depth === 0) {
    output(success(page));
    return;
  }

  // depth >= 1: return pages array with linked pages
  const rootPage: PageEntry = { title: page.title, lines: page.lines };
  const seenTitles = new Set([rootPage.title]);
  const allPages: PageEntry[] = [rootPage];

  const oneHopPages = compact(
    await Promise.all(
      (page.relatedPages?.links1hop ?? []).map(linked =>
        tryFetchPage(opts.project, linked.title, opts.sid),
      ),
    ),
  );
  for (const p of oneHopPages) {
    seenTitles.add(p.title);
    allPages.push(p);
  }

  if (depth >= 2) {
    const twoHopPages = compact(
      await Promise.all(
        (page.relatedPages?.links2hop ?? [])
          .filter(linked => !seenTitles.has(linked.title))
          .map(linked => tryFetchPage(opts.project, linked.title, opts.sid)),
      ),
    );
    for (const p of twoHopPages) {
      allPages.push(p);
    }
  }

  output(success({ pages: allPages }));
}
