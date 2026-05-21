import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Reimplementación local (los tests no compilan TS) — debe quedar alineada con
// backend/src/lib/rateLimit.ts.
function makeStore() {
  return new Map();
}

function rateLimit(store, key, max, windowMs, now = Date.now()) {
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetMs: windowMs };
  }
  existing.count += 1;
  const resetMs = existing.resetAt - now;
  if (existing.count > max) return { ok: false, remaining: 0, resetMs };
  return { ok: true, remaining: Math.max(0, max - existing.count), resetMs };
}

describe("rateLimit", () => {
  it("permite hasta max y bloquea el siguiente", () => {
    const store = makeStore();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      assert.equal(rateLimit(store, "k", 5, 60_000, now).ok, true);
    }
    assert.equal(rateLimit(store, "k", 5, 60_000, now).ok, false);
  });

  it("se resetea tras la ventana", () => {
    const store = makeStore();
    const inicio = 2_000_000;
    rateLimit(store, "k", 1, 60_000, inicio);
    assert.equal(rateLimit(store, "k", 1, 60_000, inicio + 30_000).ok, false);
    assert.equal(rateLimit(store, "k", 1, 60_000, inicio + 61_000).ok, true);
  });
});
