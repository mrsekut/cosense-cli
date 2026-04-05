import type { ParsedArgs } from "../../lib/args.ts";
import type { Format } from "../../lib/output.ts";
import { output, error } from "../../lib/output.ts";
import { pageGet } from "./get.ts";
import { pageList } from "./list.ts";
import { pageSearch } from "./search.ts";
import { pageCreate } from "./create.ts";
import { pageAppend } from "./append.ts";

export async function pageCommand(parsed: ParsedArgs, format: Format): Promise<void> {
  const subcommand = parsed.commands[1];

  switch (subcommand) {
    case "get":
      await pageGet(parsed, format);
      break;
    case "list":
      await pageList(parsed, format);
      break;
    case "search":
      await pageSearch(parsed, format);
      break;
    case "create":
      await pageCreate(parsed, format);
      break;
    case "append":
      await pageAppend(parsed, format);
      break;
    default:
      output(error("UNKNOWN_SUBCOMMAND", "Usage: cosense page <get|list|search|create|append>"), format);
  }
}
