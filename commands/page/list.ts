import type { ParsedArgs } from "../../lib/args.ts";
import { getString, getNumber } from "../../lib/args.ts";
import type { Format } from "../../lib/output.ts";
import { output, success } from "../../lib/output.ts";
import { resolveOptions } from "../../lib/config.ts";
import { fetchPageList } from "../../lib/cosense.ts";

export async function pageList(parsed: ParsedArgs, format: Format): Promise<void> {
  const opts = await resolveOptions({
    profile: getString(parsed.flags, "profile"),
    project: getString(parsed.flags, "project"),
  });

  const data = await fetchPageList(opts.project, {
    sort: getString(parsed.flags, "sort"),
    limit: getNumber(parsed.flags, "limit"),
    skip: getNumber(parsed.flags, "skip"),
    sid: opts.sid,
  });

  output(success(data), format);
}
