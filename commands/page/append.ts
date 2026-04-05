import type { ParsedArgs } from "../../lib/args.ts";
import { getString, getBool } from "../../lib/args.ts";
import type { Format } from "../../lib/output.ts";
import { output, success, error } from "../../lib/output.ts";
import { resolveOptions } from "../../lib/config.ts";
import { appendLines } from "../../lib/cosense.ts";
import { markdownToScrapbox } from "../../lib/markdown.ts";

export async function pageAppend(parsed: ParsedArgs, format: Format): Promise<void> {
  const title = parsed.commands[2];
  if (!title) {
    output(error("MISSING_ARGUMENT", "Usage: cosense page append <title> --body <text>"), format);
    return;
  }

  const opts = await resolveOptions({
    profile: getString(parsed.flags, "profile"),
    project: getString(parsed.flags, "project"),
  });

  let body = getString(parsed.flags, "body") ?? "";

  if (getBool(parsed.flags, "body-stdin")) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of Bun.stdin.stream()) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks).toString("utf-8");
  }

  const inputFormat = getString(parsed.flags, "input-format") ?? "md";
  if (inputFormat === "md" && body) {
    body = await markdownToScrapbox(body);
  }

  const lines = body.split("\n");
  const data = await appendLines(opts.project, title, lines, {
    after: getString(parsed.flags, "after"),
    sid: opts.sid,
  });
  output(success({ title, ...data }), format);
}
