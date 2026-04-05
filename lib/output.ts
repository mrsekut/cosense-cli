export interface SuccessResult<T> {
  ok: true;
  data: T;
}

export interface ErrorResult {
  ok: false;
  error: { code: string; message: string };
}

export type Result<T> = SuccessResult<T> | ErrorResult;

export function success<T>(data: T): SuccessResult<T> {
  return { ok: true, data };
}

export function error(code: string, message: string): ErrorResult {
  return { ok: false, error: { code, message } };
}

export type Format = 'json' | 'text';

export function output(result: Result<unknown>, format: Format): void {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (!result.ok) {
      console.error(`Error [${result.error.code}]: ${result.error.message}`);
    } else {
      console.log(formatText(result.data));
    }
  }
  process.exit(result.ok ? 0 : 1);
}

function formatText(data: unknown, indent = 0): string {
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean')
    return String(data);
  if (data === null || data === undefined) return '';

  if (Array.isArray(data)) {
    return data.map(item => formatText(item, indent)).join('\n');
  }

  if (typeof data === 'object') {
    const prefix = '  '.repeat(indent);
    return Object.entries(data)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${prefix}${key}:\n${formatText(value, indent + 1)}`;
        }
        return `${prefix}${key}: ${formatText(value, indent)}`;
      })
      .join('\n');
  }

  return String(data);
}
