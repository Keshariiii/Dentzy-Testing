// Custom ESM loader hook to redirect 'cloudflare:sockets' to our stub
// so the app can be imported under Node.js for testing.

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stubPath = pathToFileURL(join(__dirname, 'stubs', 'cloudflare-sockets.js')).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:sockets') {
    return { url: stubPath, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
