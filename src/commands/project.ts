import type { ParsedArgs } from '../args.ts';
import { getString, getBool, showHelp } from '../args.ts';
import { loadConfig, saveConfig } from '../config.ts';
import { validateConnection } from '../cosense.ts';

const HELP = `cosense project - Manage project-to-profile mappings

Usage: cosense project <subcommand> [options]

Subcommands:
  add <name> --profile <profile> [--readonly]   Register a project with a profile
  update <name> [--readonly | --no-readonly]     Update project settings
  list                                           List all configured projects
  remove <name>                                  Unregister a project

Examples:
  cosense project add my-wiki --profile personal
  cosense project add ref-wiki --profile personal --readonly
  cosense project update ref-wiki --no-readonly
  cosense project list
  cosense project remove my-wiki

Output:
  add:    {"ok": true, "data": {"project": "<name>", "profile": "<profile>", "readonly": false}}
  update: {"ok": true, "data": {"project": "<name>", ...}}
  list:   {"ok": true, "data": {"projects": [{"name": "...", "profile": "...", "readonly": false}]}}
  remove: {"ok": true, "data": {"removed": "<name>"}}
`;

export async function projectCommand(parsed: ParsedArgs): Promise<void> {
  const subcommand = parsed.positionals[1];
  showHelp(parsed.values, HELP);
  if (!subcommand) {
    console.log(HELP);
    process.exit(0);
  }

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

      const sid = config.profiles[profile].sid;
      const check = await validateConnection(name, sid);
      if (!check.ok) {
        console.error(`Project "${name}" is not accessible: ${check.message}`);
        process.exit(1);
      }

      const readonly = getBool(parsed.values, 'readonly');
      config.projects[name] = {
        profile,
        ...(readonly ? { readonly: true } : {}),
      };
      await saveConfig(config);
      console.log(
        JSON.stringify({
          ok: true,
          data: { project: name, profile, readonly },
        }),
      );
      break;
    }

    case 'update': {
      const name = parsed.positionals[2];
      if (!name) {
        console.error(
          'Usage: cosense project update <name> [--readonly | --no-readonly]',
        );
        process.exit(1);
      }
      const config = await loadConfig();
      const entry = config.projects[name];
      if (!entry) {
        console.error(
          `Project "${name}" not found. Run: cosense project add ${name} --profile <profile>`,
        );
        process.exit(1);
      }
      if (getBool(parsed.values, 'readonly')) {
        entry.readonly = true;
      } else if (getBool(parsed.values, 'no-readonly')) {
        delete entry.readonly;
      }
      await saveConfig(config);
      console.log(
        JSON.stringify({
          ok: true,
          data: {
            project: name,
            profile: entry.profile,
            readonly: entry.readonly ?? false,
          },
        }),
      );
      break;
    }

    case 'list': {
      const config = await loadConfig();
      const projects = Object.entries(config.projects).map(([name, entry]) => ({
        name,
        profile: entry.profile,
        readonly: entry.readonly ?? false,
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
      console.log(HELP);
      process.exit(1);
  }
}
