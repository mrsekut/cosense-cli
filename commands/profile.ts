import type { ParsedArgs } from '../lib/args.ts';
import { getString } from '../lib/args.ts';
import { loadConfig, saveConfig } from '../lib/config.ts';

export async function profileCommand(parsed: ParsedArgs): Promise<void> {
  const subcommand = parsed.positionals[1];

  switch (subcommand) {
    case 'set': {
      const name = parsed.positionals[2];
      if (!name) {
        console.error(
          'Usage: cosense profile set <name> --sid <sid> --project <project>',
        );
        process.exit(1);
      }
      const sid = getString(parsed.values, 'sid');
      const project = getString(parsed.values, 'project');
      if (!sid || !project) {
        console.error('Both --sid and --project are required.');
        process.exit(1);
      }
      const config = await loadConfig();
      config.profiles[name] = { sid, defaultProject: project };
      await saveConfig(config);
      console.log(
        JSON.stringify({ ok: true, data: { profile: name, project } }),
      );
      break;
    }

    case 'list': {
      const config = await loadConfig();
      const profiles = Object.entries(config.profiles).map(([name, p]) => ({
        name,
        defaultProject: p.defaultProject,
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
      console.error(
        'Usage: cosense profile <set|list|remove>',
      );
      process.exit(1);
  }
}
