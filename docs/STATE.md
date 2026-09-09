# State

Updated at the close of every block. This is the handoff document: it is what a
new session reads to know where the project stands without replaying history.

Keep it short. It records state, not narrative.

---

## Current position

**Block 1B code complete, deploy pending.** Commit `b4dba74`.

- Block 0 (scaffolding) closed, commit `81b5de5`.
- Block 1A (catalog + wall model, zero three imports) closed, commit `df1b33c`.
- Block 1A colorway correction closed, commit `65052d9`.
- Block 1B (R3F scene, control panel) closed, commit `b4dba74`.
- **Blocked**: Cloudflare Pages deploy. `wrangler` is not authenticated on this
  machine and `wrangler login` is interactive. Block 1 does not close until the
  public URL exists.
- **Next after deploy**: Block 2 (takeoff, 90 degree return, URL state, presets,
  locked feature registry).

## Environment

React 19.2.8 · three 0.186.0 · @react-three/fiber 9.7.0 · @react-three/drei
10.7.8 · zustand 5.0.15 · @supabase/supabase-js 2.116.0 · tailwindcss 4.2.5 via
@tailwindcss/vite · vite 8.2.2 · typescript 6.0.2 · @types/three 0.185.4

No peer dependency conflicts. `@types/three` is an explicit devDependency
because three 0.186 ships no declarations of its own.

Supabase project `kxnkrlpvhibkzoktzcgd`. Table `public.leads` provisioned, RLS
on, `anon` holds INSERT only. `.env` is present and gitignored. **Do not create
or migrate tables.**

## Decisions taken beyond the spec

- Catalog example dimensions changed to 36x18x8 / 24x16x6 / 18x12x4. The spec's
  original first two had identical volume, so "the largest SKU" was ambiguous.
- `model/types.ts` exists (spec §6 lists it; `wall.ts` cannot be typed without
  it). `TakeoffLine` deferred to block 2 with `takeoff.ts`.
- Locked SKUs are a **separate type**, not a `WallSku` with `locked: true`. They
  carry no dimensions, so a discriminated union lets the compiler reject passing
  a locked style to `deriveWall`.
- Jitter is applied after clipping, so a block may protrude up to 0.15" past the
  end of the run. Cosmetic, accepted.
- `capForWallSku` derives cap geometry from the block rather than storing it.
  Cap price lives in `pricing.ts`.
- Style names are descriptive per SPEC §7. The five original locked names were
  real manufacturer product lines and were replaced.
- Pieces are drawn 0.25" undersized (`JOINT_REVEAL_IN`) so every joint reads as
  a shadow line. Layout, counts and takeoff are unaffected.
- `Bounds` was dropped for the fallback SPEC §13 allows: it fought
  `OrbitControls` over the camera target. The frustum is fitted directly, once
  per dimension change, never per frame.
- The canvas runs with tone mapping off (`<Canvas flat>`) so a rendered block
  matches the swatch that was clicked. With ACES the colours drifted, which is
  not acceptable when material selection is the product.
- Terrain is a ground plane plus one turfed bank. The additional slope plane
  SPEC §8.8 describes read as a floating panel and was removed.
- `HumanFigure` yaws toward the camera in `useFrame` instead of using drei's
  `<Billboard>`, which leaned the silhouette when the camera rose. This is a
  facing angle, not a derivation.
- `oxlint` reports one `react/immutability` warning in `Scene.tsx`. It is a
  false positive on R3F's imperative camera API; neither an oxlint nor an
  eslint disable directive suppresses it. Lint still exits 0.

## Open items

- Cloudflare Pages deploy not yet done. It is the closing gate of block 1.
- The takeoff panel must not visually outweigh the style and colorway controls
  (SPEC §1, §9).
- The style grid shows active SKUs only. The three locked styles need
  `LockedControl`, which arrives with the block 2 feature registry.
- The scale figure is a flat cutout, so it foreshortens when the camera is
  high. Correct for what it is; noted in case it reads as a defect.

## Verified reference numbers

Preset "Backyard terrace — 40' × 6 courses", SKU 36×18×8, setback 1"/course:
6 courses, 48" high, 14 blocks per course (84 total), running bond offset 18" on
even courses, cumulative setback 5" at the top course. Odd courses clip block 14
to 12.00"; even courses open with an 18.00" half block and clip block 14 to
30.00". `deriveWall` is deterministic across repeated calls.

## Block 1B verification

Production build served and driven in a headless browser: every style, every
colorway, both slider extremes and the cap toggle, with zero console errors and
zero page errors. Camera is stable at rest.

Panel and scene agree because they read one derivation: at 40' x 6 courses the
readout shows 84 units, 14 caps and a finished height of 4' 3", which is the
1A hand calculation. Colorway survives a style switch: Charcoal chosen on Large
Outcropping is still Charcoal after switching to Weathered Fieldstone, and
Gray Granite returns when a style that offers it is selected again.

Instance ceiling is 1024; the largest configuration the controls allow, 80' by
10 courses, derives 275 units.
