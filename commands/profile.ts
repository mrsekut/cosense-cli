import type { ParsedArgs } from '../lib/args.ts';
import { getString, showHelp } from '../lib/args.ts';
import { loadConfig, saveConfig } from '../lib/config.ts';
import { promptText, promptSecret } from '../lib/prompt.ts';

const HELP = `cosense profile - Manage authentication profiles

Usage: cosense profile <subcommand> [options]

Subcommands:
  set [name] [--sid <sid>]   Create or update a profile
  list                       List all saved profiles
  remove <name>              Delete a profile

Examples:
  cosense profile set personal --sid "s%3Aabc..."
  cosense profile set                             # interactive mode
  cosense profile list
  cosense profile remove old-account

Output:
  set:    {"ok": true, "data": {"profile": "<name>"}}
  list:   {"ok": true, "data": {"profiles": [{"name": "...", "hasSid": true}]}}
  remove: {"ok": true, "data": {"removed": "<name>"}}
`;

export async function profileCommand(parsed: ParsedArgs): Promise<void> {
  const subcommand = parsed.positionals[1];
  showHelp(parsed.values, HELP);
  if (!subcommand) {
    console.log(HELP);
    process.exit(0);
  }

  switch (subcommand) {
    case 'set': {
      const name =
        parsed.positionals[2] ??
        (await promptText(
          'Profile name',
          'Enter a profile name (e.g. personal, work)',
        ));
      const sid =
        getString(parsed.values, 'sid') ??
        (await promptSecret(
          'connect.sid',
          'Enter the connect.sid value from your Cosense browser cookie',
        ));

      if (!name || !sid) {
        console.error('name and sid are required.');
        process.exit(1);
      }

      const config = await loadConfig();
      config.profiles[name] = { sid };
      await saveConfig(config);
      console.log(JSON.stringify({ ok: true, data: { profile: name } }));
      break;
    }

    case 'list': {
      const config = await loadConfig();
      const profiles = Object.entries(config.profiles).map(([name, p]) => ({
        name,
        hasSid: !!p.sid,
      }));
      console.log(JSON.stringify({ ok: true, data: { profiles } }, null, 2));
      break;
    }

    case 'remove': {
      const name = parsed.positionals[2];
      if (!name) {
        console.error('Usage: cosense profile remove <name>');
        process.exit(1);
      }
      const config = await loadConfig();
      delete config.profiles[name];
      await saveConfig(config);
      console.log(JSON.stringify({ ok: true, data: { removed: name } }));
      break;
    }

    default:
      console.log(HELP);
      process.exit(1);
  }
}
