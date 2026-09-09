# State

Updated at the close of every block. This is the handoff document: it is what a
new session reads to know where the project stands without replaying history.

Keep it short. It records state, not narrative.

---

## Current position

**Block 1B code complete and reviewed, deploy pending.** Commit `b4dba74`.

The 1B report was reviewed against the spec. All three reported deviations are
accepted and have been written into `SPEC.md` (§8.8 terrain, §13 tone mapping),
so they are no longer deviations. One defect was found and is pending: see
`Tumbled Ashlar` under open items.

- Block 0 (scaffolding) closed, commit `81b5de5`.
- Block 1A (catalog + wall model, zero three imports) closed, commit `df1b33c`.
- Block 1A colorway correction closed, commit `65052d9`.
- Block 1B (R3F scene, control panel) closed, commit `b4dba74`.
- **Blocked**: Cloudflare Pages deploy. `wrangler` is not authenticated on this
  machine and `wrangler login` is interactive. Block 1 does not close until the
  public URL exists.
- **Next after deploy**: Block 2, split into 2A takeoff, 2B registry + presets +
  URL state, 2C 90 degree return. Order and the 2C fallback are in
  `docs/EXECUTION.md`.

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
  real manufacturer product lines and were replaced. `Outcropping` is also a
  real line and has been struck from the §7 example list; the active SKU that
  used it becomes `Tumbled Ashlar`.
- The engineered wall notice keys on wall height **excluding caps** (SPEC §9).
  6 courses is exactly 48" and does not trigger it; the 7th course does.
- Pieces are drawn 0.25" undersized (`JOINT_REVEAL_IN`) so every joint reads as
  a shadow line. Layout, counts and takeoff are unaffected.
- `Bounds` was dropped for the fallback SPEC §13 allows: it fought
  `OrbitControls` over the camera target. The frustum is fitted directly, once
  per dimension change, never per frame.
- Tone mapping off (`<Canvas flat>`) and the single turfed bank in place of a
  separate slope plane are both now in SPEC §13 and §8.8. Do not re-litigate.
- `HumanFigure` yaws toward the camera in `useFrame` instead of using drei's
  `<Billboard>`, which leaned the silhouette when the camera rose. This is a
  facing angle, not a derivation.
- `oxlint` reports one `react/immutability` warning in `Scene.tsx`. It is a
  false positive on R3F's imperative camera API; neither an oxlint nor an
  eslint disable directive suppresses it. Lint still exits 0.

## Open items

- Cloudflare Pages deploy not yet done. It is the closing gate of block 1.
  `wrangler` auth is a manual step outside the agent: `npx wrangler login` in a
  real terminal, or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` exported in
  the shell that launches the agent. Never in a prompt. `wrangler pages project
  create` must run before `pages deploy`, or the deploy opens an interactive
  prompt and hangs.
- Rename the active SKU `Tumbled Ashlar` to `Tumbled Ashlar` and grep the
  repo for all six struck names.
- Confirm where the config lives. The 1B report says App derives once, which
  does not say whether the config sits in `store/useConfigurator.ts` as SPEC §5
  and §6 require. URL state in 2B depends on the answer.
- `VersionBadge` (SPEC §13) not yet reported as built. Lands in 2B.
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
1A hand calculation. Colorway survives a style switch: Charcoal chosen on the
36" SKU is still Charcoal after switching to Weathered Fieldstone, and Gray
Granite returns when a style that offers it is selected again.

Instance ceiling is 1024; the largest configuration the controls allow, 80' by
10 courses, derives 275 units.
