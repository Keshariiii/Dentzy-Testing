export function safeWait(c, promise) {
  try {
    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(promise);
      return;
    }
  } catch {}
  promise?.catch?.(() => {});
}
