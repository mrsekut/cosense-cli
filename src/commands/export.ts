import type { ParsedArgs } from '../args.ts';
import { getString, getNumber, showHelp } from '../args.ts';
import { output, success, error } from '../output.ts';
import { resolveOptions } from '../config.ts';
import { fetchPage } from '../cosense.ts';

const HELP = `cosense export - Export pages for AI consumption

Usage: cosense export <title> [options]

Options:
  --project <name>   Project name (required)
  --depth <1|2>      Link follow depth (default: 1)
                       1 = root page + 1-hop linked pages
                       2 = root page + 1-hop + 2-hop linked pages

Examples:
  cosense export "My Page" --project my-wiki
  cosense export "My Page" --project my-wiki --depth 2

Output:
  {"ok": true, "data": {"pages": [{"title": "...", "lines": ["..."]}]}}
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

export async function exportCommand(parsed: ParsedArgs): Promise<void> {
  showHelp(parsed.values, HELP);

  const project = getString(parsed.values, 'project');
  if (!project) {
    output(error('MISSING_ARGUMENT', '--project is required'));
    return;
  }
  const opts = await resolveOptions({ project });

  const depth = getNumber(parsed.values, 'depth') ?? 1;

  const title = parsed.positionals[1];
  if (!title) {
    output(
      error('MISSING_ARGUMENT', 'Usage: cosense export <title> [--depth 1|2]'),
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
