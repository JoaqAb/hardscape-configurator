/**
 * Deterministic pseudo-random numbers (SPEC §8.5).
 *
 * The same URL must always produce the same wall, so the per-block variation
 * cannot come from `Math.random`. Every draw is seeded from the block's own
 * coordinates, which also means a given block keeps its character when the run
 * grows: adding blocks to the right does not reshuffle the ones already there.
 */

/** FNV-1a style mix. Order matters, so (0, 1) and (1, 0) do not collide. */
export function hashSeed(...parts: number[]): number {
  let hash = 0x811c9dc5
  for (const part of parts) {
    hash ^= part | 0
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** mulberry32: small, fast, and good enough for cosmetic jitter. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One draw mapped to [-amplitude, +amplitude). */
export function jitter(rand: () => number, amplitude: number): number {
  return (rand() * 2 - 1) * amplitude
}
