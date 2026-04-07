import { homedir } from 'node:os';
import { join } from 'node:path';

export type Profile = {
  sid: string;
};

export type ProjectEntry = {
  profile: string;
  readonly?: boolean;
};

export type Config = {
  profiles: Record<string, Profile>;
  projects: Record<string, ProjectEntry>;
};

const CONFIG_DIR = join(homedir(), '.config', 'cosense-cli');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<Config> {
  try {
    const file = Bun.file(CONFIG_PATH);
    const raw = await file.json();
    validateConfigFormat(raw);
    return raw as Config;
  } catch (e) {
    if (e instanceof ConfigFormatError) throw e;
    return { profiles: {}, projects: {} };
  }
}

class ConfigFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigFormatError';
  }
}

function validateConfigFormat(raw: unknown): void {
  if (typeof raw !== 'object' || raw === null) return;
  const obj = raw as Record<string, unknown>;

  // Detect old format: profiles with defaultProject or sid at profile level with defaultProject
  if (obj.profiles && typeof obj.profiles === 'object') {
    for (const [name, profile] of Object.entries(
      obj.profiles as Record<string, unknown>,
    )) {
      if (
        typeof profile === 'object' &&
        profile !== null &&
        'defaultProject' in profile
      ) {
        throw new ConfigFormatError(
          `Outdated config.json format: profile "${name}" contains defaultProject.\n` +
            `Delete ~/.config/cosense-cli/config.json and re-configure with: cosense profile set / cosense project add`,
        );
      }
    }
  }

  // Ensure projects key exists if profiles exists
  if (obj.profiles && !obj.projects) {
    (obj as Record<string, unknown>).projects = {};
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const { mkdirSync } = await import('node:fs');
  mkdirSync(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export async function getProfile(name: string): Promise<Profile | undefined> {
  const config = await loadConfig();
  return config.profiles[name];
}

export async function resolveOptions(args: {
  project: string;
}): Promise<{ sid?: string; project: string; readonly: boolean }> {
  const config = await loadConfig();
  const projectEntry = config.projects[args.project];
  if (!projectEntry) {
    throw new Error(
      `Project "${args.project}" is not registered. Run: cosense project add ${args.project} --profile <profile-name>`,
    );
  }
  const profile = config.profiles[projectEntry.profile];
  if (!profile) {
    throw new Error(
      `Profile "${projectEntry.profile}" not found. Run: cosense profile set ${projectEntry.profile} --sid <sid>`,
    );
  }
  return {
    sid: profile.sid,
    project: args.project,
    readonly: projectEntry.readonly ?? false,
  };
}
