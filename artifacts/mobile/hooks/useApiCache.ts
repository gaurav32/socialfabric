import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@sfabric/api/";

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
}

async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: new Date().toISOString() };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {}
}

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    return status === 429 || status >= 500;
  }
  return false;
}

/**
 * Wraps any async fetcher with AsyncStorage caching.
 * On 429 or 5xx, transparently serves stale cached data instead of throwing.
 * Stores successful responses so they are always available as fallback.
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const data = await fetcher();
    await writeCache(cacheKey, data);
    return data;
  } catch (err: unknown) {
    if (isRetryableError(err)) {
      const cached = await readCache<T>(cacheKey);
      if (cached) return cached.data;
    }
    throw err;
  }
}

/**
 * Read the cache entry metadata (e.g. to show "last updated" timestamps).
 */
export async function getCacheEntry<T>(
  cacheKey: string,
): Promise<CacheEntry<T> | null> {
  return readCache<T>(cacheKey);
}
