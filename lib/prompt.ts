/**
 * Interactive prompt utilities using only built-in APIs.
 */

const reader = (): AsyncIterableIterator<string> => {
  const decoder = new TextDecoder();
  return (async function* () {
    for await (const chunk of process.stdin as unknown as AsyncIterable<Uint8Array>) {
      yield decoder.decode(chunk);
    }
  })();
};

/** Prompt for visible text input. */
export async function promptText(label: string, help: string): Promise<string> {
  process.stderr.write(`\n  ${help}\n`);
  process.stderr.write(`${label}: `);

  const iter = reader();
  const { value } = await iter.next();
  return (value ?? '').trim();
}

/** Prompt for secret input (characters are not echoed). */
export async function promptSecret(
  label: string,
  help: string,
): Promise<string> {
  process.stderr.write(`\n  ${help}\n`);
  process.stderr.write(`${label}: `);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  let result = '';
  try {
    for await (const chunk of process.stdin as unknown as AsyncIterable<Uint8Array>) {
      const str = new TextDecoder().decode(chunk);
      for (const ch of str) {
        // Enter
        if (ch === '\r' || ch === '\n') {
          process.stderr.write('\n');
          return result.trim();
        }
        // Ctrl-C
        if (ch === '\x03') {
          process.stderr.write('\n');
          process.exit(130);
        }
        // Backspace / Delete
        if (ch === '\x7f' || ch === '\b') {
          result = result.slice(0, -1);
          continue;
        }
        result += ch;
      }
    }
  } finally {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  }
  return result.trim();
}
