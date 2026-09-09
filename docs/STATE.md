# State

Updated at the close of every block. This is the handoff document: it is what a
new session reads to know where the project stands without replaying history.

Keep it short. It records state, not narrative.

---

## Current position

**Block 1 closed. Block 2A (takeoff) complete.** Commits `f6526a2`, `c97f8dc`,
`10d97be`.

Live: `https://hardscape-configurator.hardscape-configurator.workers.dev`

- Block 0 (scaffolding) closed, commit `81b5de5`.
- Block 1A (catalog + wall model, zero three imports) closed, commit `df1b33c`.
- Block 1A colorway correction closed, commit `65052d9`.
- Block 1B (R3F scene, control panel) closed, commit `b4dba74`.
- Block 1 closed by the deploy. The `Tumbled Ashlar` rename and the oxlint
  comment shipped with it.
- Block 2A (pricing, takeoff model, TakeoffPanel) complete.
- **The live URL still serves the block 1 build**, without the takeoff. It has
  to be redeployed; see the standing rules in `docs/EXECUTION.md`.
- **Next**: 2B (registry, presets, URL state), then 2C (90 degree return).

## Environment

React 19.2.8 · three 0.186.0 · @react-three/fiber 9.7.0 · @react-three/drei
10.7.8 · zustand 5.0.15 · @supabase/supabase-js 2.116.0 · tailwindcss 4.2.5 via
@tailwindcss/vite · vite 8.2.2 · typescript 6.0.2 · @types/three 0.185.4

No peer dependency conflicts. `@types/three` is an explicit devDependency
because three 0.186 ships no declarations of its own.

Supabase project `kxnkrlpvhibkzoktzcgd`. Table `public.leads` provisioned, RLS
on, `anon` holds INSERT only. `.env` is present and gitignored. **Do not create
or migrate tables.**

Hosting is Cloudflare Workers static assets, not a legacy Pages project: Pages
was folded into Workers. Redeploy with `npx wrangler deploy`. The failure modes
are documented in `docs/EXECUTION.md`.

Config lives in `store/useConfigurator.ts` (zustand); `App.tsx` only reads it
through a selector and there is no `useState` in the app. URL state in 2B mounts
directly on the store, with no migration first.

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
- Clipped blocks bill as whole units: the builder buys the block and cuts it on
  site. 84 instances is 84 units, and the weight is therefore delivered weight,
  not in-wall weight.
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

- **Redeploy.** The live URL serves the block 1 build, without the takeoff.
- **Rounding defect.** The lines read $2,058 + $292 + $109 + $38 = $2,497 and
  the estimated total shows $2,496. Round once, and make the total the sum of
  the rounded lines. On a customer-facing quote, an arithmetic that does not add
  up is the first thing anyone notices.
- **Unrequested stack change.** `wrangler pages project create` added
  `@cloudflare/vite-plugin` to devDependencies, put `cloudflare()` into
  `vite.config.ts` and replaced the `preview` script with `wrangler dev`.
  Decision: keep `wrangler` (the deploy needs it), remove the plugin and restore
  `preview` to `vite preview`. A host-specific plugin in the build config
  contradicts the portability claim of SPEC §1 and nobody chose it. If removing
  it breaks the deploy, put it back and say so.
- A blind find-and-replace turned an open item in this file into "Rename the
  active SKU `Tumbled Ashlar` to `Tumbled Ashlar`". Fixed. Renames in prose need
  reading, not `sed`.
- `VersionBadge` (SPEC §13) not yet reported as built. Lands in 2B.
- The `workers.dev` hostname doubles the project name. Cosmetic. If it matters
  for the client, point a subdomain in block 3; not worth time before that.
- The takeoff panel must not visually outweigh the style and colorway controls
  (SPEC §1, §9).
- The style grid shows active SKUs only. The three locked styles need
  `LockedControl`, which arrives with the block 2 feature registry.
- Unit prices are computed into `TakeoffLine.unitPrice` but not rendered: at
  320px the panel shows label, quantity and line total only (SPEC §9 asks for
  compact). The field is there when a wider layout wants it.
- The cap line is omitted when caps are off rather than shown as a zero row.
- Cap price is `sku.pricePerUnit * pricing.capPriceFactor`, so it scales with
  the SKU instead of being one flat number for all three.
- Block and cap counts were removed from the control panel: they live in the
  takeoff now, and one number should not have two homes.
- Presets carry dimensions only, never style or colorway (SPEC §14 says "the
  whole config"; §1 says material selection is primary, and it wins).
- URL params that are well formed but out of range fall back to defaults rather
  than clamping. One rule for every number.
- `LockedWallSku` carries `estimateHours`, because locked styles live in the
  catalog and §10 requires every locked control to show an estimate.
- Money is rounded exactly once, in `lineTotal`, so the estimate is the sum of
  the rounded lines and the column adds up by hand.
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

## Block 2A verification

Takeoff and scene cannot disagree because they read one field. `wall.ts` sets
`blockCount: blocks.length` from the array it has just built; `Wall.tsx` draws
that array via `courseBlocks` with `range={derived.blockCount}`; `takeoff.ts`
bills `qty: derived.blockCount`. There is no second count anywhere.

40' x 6, Tumbled Ashlar 36x18x8: 160 sq ft of face, 84 units, 14 caps, 2.6 tons
of gravel, 4 tubes, $2,496 estimated, 39,077.5 lb. No engineered notice at 48"
of block. At 7 courses the notice appears and units go to 98.

The weight was checked by hand and lands exactly: 84 blocks at 3 ft³ plus 14
caps at 1.25 ft³, all at 145 lb/ft³, is 39,077.5 lb. Gravel checks too: a 30"
by 6" trench over 480" is 1.85 yd³, 2.6 tons at 1.4 ton/yd³. The estimated
total does not check: see the rounding defect in open items.

Caps off: the cap line disappears and adhesive drops from 4 tubes to 2, because
only the top course joint is left to bed.
