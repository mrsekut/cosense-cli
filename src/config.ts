import { homedir } from 'node:os';
import { join } from 'node:path';
import * as v from 'valibot';

const ProfileSchema = v.object({ sid: v.string() });
const ProjectEntrySchema = v.object({
  profile: v.string(),
  readonly: v.optional(v.boolean()),
});
const ConfigSchema = v.object({
  profiles: v.record(v.string(), ProfileSchema),
  projects: v.record(v.string(), ProjectEntrySchema),
});

export type Profile = v.InferOutput<typeof ProfileSchema>;
export type ProjectEntry = v.InferOutput<typeof ProjectEntrySchema>;
export type Config = v.InferOutput<typeof ConfigSchema>;

const CONFIG_DIR = join(homedir(), '.config', 'cosense-cli');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<Config> {
  try {
    const file = Bun.file(CONFIG_PATH);
    const raw = await file.json();
    return v.parse(ConfigSchema, withDefaults(raw));
  } catch (e) {
    if (e instanceof v.ValiError) {
      throw new Error(
        `Invalid config.json: ${e.message}\nDelete ~/.config/cosense-cli/config.json and re-configure.`,
      );
    }
    return { profiles: {}, projects: {} };
  }
}

function withDefaults(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const obj = raw as Record<string, unknown>;
  if (obj['profiles'] && !obj['projects']) {
    return { ...obj, projects: {} };
  }
  return obj;
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
