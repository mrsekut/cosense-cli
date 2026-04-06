import { parseArgs as nodeParseArgs } from 'node:util';

export type ParsedArgs = {
  positionals: string[];
  values: Record<string, string | boolean | undefined>;
};

export const parseArgs = (argv: string[]): ParsedArgs => {
  const { values, positionals } = nodeParseArgs({
    args: argv.slice(2),
    options: {
      profile: { type: 'string' },
      project: { type: 'string' },
      help: { type: 'boolean' },
      sid: { type: 'string' },
      body: { type: 'string' },
      'body-stdin': { type: 'boolean' },
      'input-format': { type: 'string' },
      after: { type: 'string' },
      sort: { type: 'string' },
      limit: { type: 'string' },
      skip: { type: 'string' },
      depth: { type: 'string' },
      all: { type: 'boolean' },
    },
    allowPositionals: true,
    strict: false,
  });
  return {
    positionals,
    values: values as ParsedArgs['values'],
  };
};

export const getString = (
  values: ParsedArgs['values'],
  key: string,
): string | undefined => {
  const val = values[key];
  return typeof val === 'string' ? val : undefined;
};

export const getNumber = (
  values: ParsedArgs['values'],
  key: string,
): number | undefined => {
  const val = getString(values, key);
  return val !== undefined ? Number(val) : undefined;
};

export const getBool = (values: ParsedArgs['values'], key: string): boolean =>
  values[key] !== undefined;
