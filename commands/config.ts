import type { ParsedArgs } from "../lib/args.ts";
import { getString } from "../lib/args.ts";
import { loadConfig, saveConfig } from "../lib/config.ts";

export async function configCommand(parsed: ParsedArgs): Promise<void> {
  const subcommand = parsed.commands[1];

  switch (subcommand) {
    case "set-profile": {
      const name = parsed.commands[2];
      if (!name) {
        console.error("Usage: cosense config set-profile <name> --sid <sid> --project <project>");
        process.exit(1);
      }
      const sid = getString(parsed.flags, "sid");
      if (!sid) {
        console.error("Usage: cosense config set-profile <project-name> --sid <sid>");
        process.exit(1);
      }
      const project = getString(parsed.flags, "project") ?? name;
      const config = await loadConfig();
      config.profiles[name] = { sid, defaultProject: project };
      await saveConfig(config);
      console.log(JSON.stringify({ ok: true, data: { profile: name, project } }));
      break;
    }

    case "list-profiles": {
      const config = await loadConfig();
      const profiles = Object.entries(config.profiles).map(([name, p]) => ({
        name,
        defaultProject: p.defaultProject,
        hasSid: !!p.sid,
      }));
      console.log(JSON.stringify({ ok: true, data: { profiles } }, null, 2));
      break;
    }

    case "remove-profile": {
      const name = parsed.commands[2];
      if (!name) {
        console.error("Usage: cosense config remove-profile <name>");
        process.exit(1);
      }
      const config = await loadConfig();
      delete config.profiles[name];
      await saveConfig(config);
      console.log(JSON.stringify({ ok: true, data: { removed: name } }));
      break;
    }

    default:
      console.error("Usage: cosense config <set-profile|list-profiles|remove-profile>");
      process.exit(1);
  }
}
