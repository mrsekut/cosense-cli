import type { ParsedArgs } from '../lib/args.ts';
import { getString } from '../lib/args.ts';
import { loadConfig, saveConfig } from '../lib/config.ts';

export async function projectCommand(parsed: ParsedArgs): Promise<void> {
  const subcommand = parsed.positionals[1];

  switch (subcommand) {
    case 'add': {
      const name = parsed.positionals[2];
      const profile = getString(parsed.values, 'profile');

      if (!name || !profile) {
        console.error('Usage: cosense project add <name> --profile <profile>');
        process.exit(1);
      }

      const config = await loadConfig();
      if (!config.profiles[profile]) {
        console.error(
          `Profile "${profile}" not found. Run: cosense profile set ${profile} --sid <sid>`,
        );
        process.exit(1);
      }

      config.projects[name] = { profile };
      await saveConfig(config);
      console.log(
        JSON.stringify({ ok: true, data: { project: name, profile } }),
      );
      break;
    }

    case 'list': {
      const config = await loadConfig();
      const projects = Object.entries(config.projects).map(([name, entry]) => ({
        name,
        profile: entry.profile,
      }));
      console.log(JSON.stringify({ ok: true, data: { projects } }, null, 2));
      break;
    }

    case 'remove': {
      const name = parsed.positionals[2];
      if (!name) {
        console.error('Usage: cosense project remove <name>');
        process.exit(1);
      }
      const config = await loadConfig();
      delete config.projects[name];
      await saveConfig(config);
      console.log(JSON.stringify({ ok: true, data: { removed: name } }));
      break;
    }

    default:
      console.error('Usage: cosense project <add|list|remove>');
      process.exit(1);
  }
}
