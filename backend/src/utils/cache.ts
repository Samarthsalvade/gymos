type Entry<T> = { exp: number; value: T };

const store = new Map<string, Entry<unknown>>();

/** Short in-memory cache for data that rarely changes. Skips empty results. */
export async function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = await load();
  if (value != null) store.set(key, { exp: Date.now() + ttlMs, value });
  return value;
}
