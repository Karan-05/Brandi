type Clock = () => number;

type CacheEntry<Value> = {
  value: Value;
  expiresAt: number;
};

export class TTLCache<Key, Value> {
  private readonly store = new Map<Key, CacheEntry<Value>>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: Clock = Date.now,
  ) {}

  get(key: Key): Value | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: Key, value: Value) {
    this.store.set(key, {
      value,
      expiresAt: this.now() + this.ttlMs,
    });
  }

  clear() {
    this.store.clear();
  }

  size() {
    this.pruneExpired();
    return this.store.size;
  }

  private pruneExpired() {
    const currentTime = this.now();

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= currentTime) {
        this.store.delete(key);
      }
    }
  }
}
