import type { ParsedArgs } from '../args.ts';
import { getString, getNumber, showHelp } from '../args.ts';
import { output, success, error } from '../output.ts';
import { resolveOptions } from '../config.ts';
import { searchPages, fetchPage } from '../cosense.ts';

const HELP = `cosense search - Search pages and fetch their content

Usage: cosense search <query> --project <name> [options]

Options:
  --project <name>   Project name (required)
  --limit <n>        Max number of pages to fetch content for (default: 5)
  --depth <0|1|2>    Link follow depth (default: 0)
                       0 = matched pages only
                       1 = + 1-hop linked pages
                       2 = + 1-hop + 2-hop linked pages

Examples:
  cosense search "TypeScript" --project my-wiki
  cosense search "TypeScript" --project my-wiki --limit 3 --depth 1

Output:
  {"ok": true, "data": {"query": "...", "pages": [{"title": "...", "lines": ["..."]}]}}
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

export async function searchCommand(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);

  const query = parsed.positionals.slice(1).join(' ');
  if (!query) {
    output(error('MISSING_ARGUMENT', 'Usage: cosense search <query>'));
    return;
  }

  const project = getString(parsed.values, 'project');
  if (!project) {
    output(error('MISSING_ARGUMENT', '--project is required'));
    return;
  }
  const opts = await resolveOptions({ project });

  const limit = getNumber(parsed.values, 'limit') ?? 5;
  const depth = getNumber(parsed.values, 'depth') ?? 0;

  const searchResult = await searchPages(opts.project, query, opts.sid);
  const topTitles = searchResult.pages.slice(0, limit).map(p => p.title);

  const seenTitles = new Set<string>();
  const allPages: PageEntry[] = [];

  // Fetch content for top matched pages
  const rootPages = compact(
    await Promise.all(
      topTitles.map(title => tryFetchPage(opts.project, title, opts.sid)),
    ),
  );
  for (const page of rootPages) {
    seenTitles.add(page.title);
    allPages.push(page);
  }

  if (depth >= 1) {
    // Fetch full page data to get relatedPages
    const fullPages = compact(
      await Promise.all(
        topTitles.map(async title => {
          try {
            return await fetchPage(opts.project, title, opts.sid);
          } catch {
            return null;
          }
        }),
      ),
    );

    const oneHopTitles = new Set<string>();
    for (const page of fullPages) {
      for (const linked of page.relatedPages?.links1hop ?? []) {
        if (!seenTitles.has(linked.title)) {
          oneHopTitles.add(linked.title);
        }
      }
    }

    const oneHopPages = compact(
      await Promise.all(
        [...oneHopTitles].map(title =>
          tryFetchPage(opts.project, title, opts.sid),
        ),
      ),
    );
    for (const page of oneHopPages) {
      seenTitles.add(page.title);
      allPages.push(page);
    }

    if (depth >= 2) {
      const twoHopTitles = new Set<string>();
      for (const page of fullPages) {
        for (const linked of page.relatedPages?.links2hop ?? []) {
          if (!seenTitles.has(linked.title)) {
            twoHopTitles.add(linked.title);
          }
        }
      }

      const twoHopPages = compact(
        await Promise.all(
          [...twoHopTitles].map(title =>
            tryFetchPage(opts.project, title, opts.sid),
          ),
        ),
      );
      for (const page of twoHopPages) {
        allPages.push(page);
      }
    }
  }

  output(success({ query, pages: allPages }));
}
