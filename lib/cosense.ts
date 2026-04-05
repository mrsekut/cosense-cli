import {
  getPage,
  listPages,
  searchForPages,
} from "@cosense/std/rest";
import { patch } from "@cosense/std/websocket";
import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
import type { BaseOptions, ListPagesOption } from "@cosense/std/rest";

export type { BaseOptions };

function baseOpts(sid?: string): BaseOptions {
  return sid ? { sid } : {};
}

export async function fetchPage(
  project: string,
  title: string,
  sid?: string,
) {
  const result = await getPage(project, title, baseOpts(sid));
  if (isErr(result)) {
    throw toError(unwrapErr(result));
  }
  const page = unwrapOk(result);
  return {
    title: page.title,
    lines: page.lines.map((l) => l.text),
    descriptions: page.descriptions,
    links: page.links,
    relatedPages: page.relatedPages,
  };
}

export async function fetchPageList(
  project: string,
  options: { sort?: string; limit?: number; skip?: number; sid?: string },
) {
  const opts: ListPagesOption = {
    ...baseOpts(options.sid),
    sort: (options.sort as ListPagesOption["sort"]) ?? "updated",
    limit: options.limit ?? 100,
    skip: options.skip ?? 0,
  };
  const result = await listPages(project, opts);
  if (isErr(result)) {
    throw toError(unwrapErr(result));
  }
  const data = unwrapOk(result);
  return {
    count: data.count,
    pages: data.pages.map((p) => ({
      title: p.title,
      descriptions: p.descriptions,
      updated: p.updated,
      views: p.views,
      linked: p.linked,
    })),
  };
}

export async function searchPages(
  project: string,
  query: string,
  sid?: string,
) {
  const result = await searchForPages(query, project, baseOpts(sid));
  if (isErr(result)) {
    throw toError(unwrapErr(result));
  }
  const data = unwrapOk(result);
  return {
    query: data.searchQuery,
    count: data.count,
    pages: data.pages.map((p) => ({
      title: p.title,
      words: p.words,
      lines: p.lines,
    })),
  };
}

export async function appendLines(
  project: string,
  title: string,
  newLines: string[],
  options: { after?: string; sid?: string },
) {
  const result = await patch(project, title, (lines) => {
    const texts = lines.map((l) => l.text);
    if (options.after) {
      const idx = texts.findIndex((t) => t.includes(options.after!));
      if (idx >= 0) {
        texts.splice(idx + 1, 0, ...newLines);
        return texts;
      }
    }
    return [...texts, ...newLines];
  }, baseOpts(options.sid));

  if (isErr(result)) {
    throw toError(unwrapErr(result));
  }
  return { commitId: unwrapOk(result) };
}

export async function createPage(
  project: string,
  title: string,
  body: string[],
  sid?: string,
) {
  const lines = [title, ...body];
  const result = await patch(project, title, () => lines, baseOpts(sid));
  if (isErr(result)) {
    throw toError(unwrapErr(result));
  }
  return { commitId: unwrapOk(result) };
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "object" && err !== null && "name" in err) {
    const e = err as { name: string; message?: string };
    return new Error(`${e.name}: ${e.message ?? "Unknown error"}`);
  }
  return new Error(String(err));
}
