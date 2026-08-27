// ponytail: crypto.randomUUID() is native on Workers. No uuid dep needed.
export const newId = () => crypto.randomUUID();

export const now = () => new Date().toISOString();
