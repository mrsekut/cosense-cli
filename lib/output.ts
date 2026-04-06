export type SuccessResult<T> = {
  ok: true;
  data: T;
};

export type ErrorResult = {
  ok: false;
  error: { code: string; message: string };
};

export type Result<T> = SuccessResult<T> | ErrorResult;

export function success<T>(data: T): SuccessResult<T> {
  return { ok: true, data };
}

export function error(code: string, message: string): ErrorResult {
  return { ok: false, error: { code, message } };
}

export function output(result: Result<unknown>): void {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
