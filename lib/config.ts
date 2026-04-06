import { homedir } from 'node:os';
import { join } from 'node:path';

export type Profile = {
  sid: string;
  defaultProject: string;
};

export type Config = {
  profiles: Record<string, Profile>;
};

const CONFIG_DIR = join(homedir(), '.config', 'cosense-cli');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<Config> {
  try {
    const file = Bun.file(CONFIG_PATH);
    return (await file.json()) as Config;
  } catch {
    return { profiles: {} };
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
  profile?: string;
  project?: string;
}): Promise<{ sid?: string; project: string }> {
  const profileName = args.profile ?? 'default';
  const profile = await getProfile(profileName);
  const project = args.project ?? profile?.defaultProject;
  if (!project) {
    throw new Error(
      `No project specified. Use --project or set a default project in profile "${profileName}".`,
    );
  }
  return { sid: profile?.sid, project };
}
