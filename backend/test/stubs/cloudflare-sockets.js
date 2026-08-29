// Stub for 'cloudflare:sockets' — Node.js doesn't have this module.
// Provides a no-op connect() so email.js can be imported without crashing.
export function connect() {
  return {
    readable: new ReadableStream(),
    writable: new WritableStream(),
    close: async () => {},
  };
}
