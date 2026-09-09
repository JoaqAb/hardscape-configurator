# State

Updated at the close of every block. This is the handoff document: it is what a
new session reads to know where the project stands without replaying history.

Keep it short. It records state, not narrative.

---

## Current position

**Block 2D closed.** Commits `f385a3a`, `cb68179`. Full bleed is live.

Live and current: `https://hardscape-configurator.hardscape-configurator.workers.dev`

- Block 0 (scaffolding) closed, `81b5de5`.
- Block 1A (catalog + wall model, zero three imports) closed, `df1b33c`.
  Colorway correction, `65052d9`.
- Block 1B (R3F scene, control panel) closed, `b4dba74`. Block 1 closed by the
  deploy.
- Block 2A (pricing, takeoff model, TakeoffPanel), `f6526a2`, `c97f8dc`,
  `10d97be`.
- Block 2B (feature registry, LockedControl, tabs, presets, URL state,
  VersionBadge), `6cf33f7`, `a90259f`, `dbe4b89`.
- Block 2C (presentation pass) complete.
- Block 2D (full-bleed layout) complete. Canvas at viewport size, two floating
  cards, measured safe area in `store/useViewport.ts`, camera fitted to the
  safe rect rather than to the canvas.
- The 90 degree return is a locked registry row and lives in `If time remains`.
- **Next**: block 2E, the legibility pass. It absorbs the four scene fixes that
  used to open block 3, so block 3 is lead capture and README only.

## Why block 2E exists

2D delivered what it promised and the picture still does not work. Measured at
1440x900: safe rect 704x852, wall projected to 486x141 px. That is 34 percent
of the window's width and 16 percent of its height. Two thirds of the window is
panel, and the subject of the demo is a small band in a large empty field.

The panels' footprint, not the camera, is what costs the wall its size. Fitting
the wall to a 704 px safe area inside a 1440 px window is working correctly and
producing a bad photograph. 2E buys the width back and separates the values in
the scene, which are currently close enough that the retained bank and the
ground read as one surface.

Decisions taken for 2E:

- The takeoff moves out of the right column and into a full-width bar along the
  bottom. It returns 320 px on the axis the wall is measured on, and a
  horizontal row of figures suits a sales summary at least as well as a
  vertical list (SPEC §9).
- The roadmap leaves the takeoff panel and becomes a collapsed pill at the top
  right: `Roadmap · N planned · Nh`, both numbers derived from `features.ts`
  plus the locked SKUs, never typed. Expanding is one click, so SPEC §10 still
  holds and the header is a stronger statement than the open list was: it is
  the budget of the next phase, in two numbers.
- The left control card stays open by default and gains a collapse control.
  Collapsing writes a smaller safe rect and 2D's existing refit path reframes
  the camera. No new machinery.
- With the takeoff on the bottom the safe area is roughly 1050x700, which is
  landscape for the first time. The both-axes fit SPEC §13 requires becomes
  meaningful, and 2E implements it.
- `built in one evening` comes off the badge. It will not be one evening, §15
  asks for the real number, and the README is where a time figure belongs with
  its context. On the product it reads as an apology offered before anyone has
  formed an opinion.

## Environment

React 19.2.8 · three 0.186.0 · @react-three/fiber 9.7.0 · @react-three/drei
10.7.8 · zustand 5.0.15 · @supabase/supabase-js 2.116.0 · tailwindcss 4.2.5 via
@tailwindcss/vite · vite 8.2.2 · typescript 6.0.2 · @types/three 0.185.4

`wrangler` is a devDependency and `npm run deploy` wraps `wrangler deploy`.
`wrangler.jsonc` carries `assets.directory`. `@cloudflare/vite-plugin` was
removed: a host-specific plugin in the build config contradicts SPEC §1.
`npm audit` reports three high advisories, all `wrangler` to `miniflare` to
`sharp`. Tooling only, never in the bundle. Do not run `audit fix --force`: it
breaks wrangler. Disclosed in the README per §15.

`@types/three` is an explicit devDependency because three 0.186 ships no
declarations of its own. No peer dependency conflicts.

Supabase project `kxnkrlpvhibkzoktzcgd`. Table `public.leads` provisioned, RLS
on, `anon` holds INSERT only. `.env` is present and gitignored. **Do not create
or migrate tables.**

Hosting is Cloudflare Workers static assets, not a legacy Pages project: Pages
was folded into Workers. Redeploy with `npx wrangler deploy`. Failure modes are
in `docs/EXECUTION.md`.

Wall config lives in `store/useConfigurator.ts` (zustand) and `App.tsx` reads it
through a selector. The measured safe area lives in a separate store,
`store/useViewport.ts`, so it never reaches `urlState`. There is no `useState`
in the app.

## Decisions taken beyond the spec

**Model and catalog**

- Catalog example dimensions are 36x18x8 / 24x16x6 / 18x12x4. The spec's
  original first two had identical volume, so "the largest SKU" was ambiguous.
- Locked SKUs are a **separate type**, not a `WallSku` with `locked: true`. They
  carry no dimensions, so a discriminated union lets the compiler reject passing
  a locked style to `deriveWall`. They carry `estimateHours` in `catalog.ts`;
  the registry holds no wall styles (SPEC §10). One number, one home.
- Style names are descriptive per SPEC §7. The five original locked names were
  real manufacturer product lines and were replaced. `Outcropping` is also a
  real line; the active SKU that used it is `Tumbled Ashlar`.
- `capForWallSku` derives cap geometry from the block rather than storing it.
  Cap price is `sku.pricePerUnit * pricing.capPriceFactor`, so it scales with
  the SKU instead of being one flat number.
- Jitter is applied after clipping, so a block may protrude up to 0.15" past the
  end of the run. Cosmetic, accepted.

**Takeoff**

- Clipped blocks bill as whole units: the builder buys the block and cuts it on
  site. 84 instances is 84 units, and the weight is delivered weight, not
  in-wall weight.
- Money is rounded exactly once, in `lineTotal`, so the estimate is the sum of
  the rounded lines and the column adds up by hand.
- The engineered wall notice keys on wall height **excluding caps** (SPEC §9).
  6 courses is exactly 48" and does not trigger it; the 7th course does.
- `TakeoffLine.unitPrice` is computed but not rendered. The field is there when
  a wider layout wants it.
- The cap line is omitted when caps are off rather than shown as a zero row.

**Config and UI**

- Presets set dimensions only, never style or colorway (SPEC §14).
- Out of range URL params fall back to defaults instead of clamping (SPEC §12).
  One rule for every number.
- Block and cap counts were removed from the control panel: they live in the
  takeoff. One number, one home.
- `Finished height` and `Copy link` are pinned to the foot of the left card,
  outside its scroll. Anything added to that card must not change that.
- Colorway chips are two per row. Three at 320px truncated `Gray Granite`.
- Panels are opaque, with no `backdrop-filter`. Readability over a rendered
  image comes first, and the filter costs a repaint for a decorative gain.
- `VersionBadge` is mounted twice with responsive visibility rather than
  portaled.

**Scene**

- No fog (SPEC §13). It washed the image, the same failure mode as ACES. The
  horizon is pushed out with a 4000 ft ground plane instead.
- Tone mapping off (`<Canvas flat>`), and one turfed bank instead of a separate
  slope plane. Both are now in SPEC §13 and §8.8. Do not re-litigate.
- Pieces are drawn 0.25" undersized (`JOINT_REVEAL_IN`) so every joint reads as
  a shadow line. Layout, counts and takeoff are unaffected.
- The retained fill is darker than the turf on purpose: the top of the fill must
  never be the lightest thing in frame.
- `Bounds` was dropped for the SPEC §13 fallback: it fought `OrbitControls` over
  the camera target. The frustum is fitted directly, in a `useLayoutEffect` keyed
  on values, never per frame.
- The camera frames the wall's own bounding box, not a bounding sphere, and not
  a box that includes the scale figure. Including the figure is what aimed the
  old camera at the top of the retained fill.
- `HumanFigure` yaws toward the camera in `useFrame` rather than using drei's
  `<Billboard>`, which leaned the silhouette when the camera rose. It is a flat
  cutout, so it foreshortens at high camera angles.
- `oxlint` reports one `react/immutability` warning in `Scene.tsx`. It is a false
  positive on R3F's imperative camera API and no disable directive suppresses
  it. Lint still exits 0.

**Review method**

- Screenshots are a review artifact and the first screenshot is a deliverable.
  Capture the viewport; the page does not scroll, the panels do.
- A verification script's pixel probe reported 0.999 for every configuration
  because it never separated the wall from the bank by colour. Deleted. A metric
  that cannot fail is worse than no metric. Any replacement must be able to
  report a failure.

## Open items

Owned by block 2E:

- The wall is 34 percent of the window's width and 16 percent of its height.
- The camera is still high enough that the top of the fill is the largest shape
  in frame. Target about 15 degrees above horizontal.
- The frustum is fitted on width only. SPEC §13 already requires both axes; code
  and spec diverge until 2E closes it.
- The retained bank's rear edge and right end face are in frame at both desktop
  sizes and it reads as a slab on a table.
- Ground, bank and wall face are too close in value. The grade change is only
  legible from the wall itself.
- `<ContactShadows />` must be confirmed mounted and visible at the base of the
  wall.
- The badge still says `built in one evening`.
- The left card overflows its height cap, so `Cap course` sits below the fold.
  The pinned footer is unaffected.
- At 390px the control panel's scroll area collapses to about one row.

Not owned by any block yet:

- The `workers.dev` hostname doubles the project name. Cosmetic. Point a
  subdomain only if time is left over.
- `docs/reports/2C.md` still describes the deleted pixel probe. It is a closed
  record and was left alone.

## Verified reference numbers

Preset "Backyard terrace — 40' × 6 courses", SKU 36×18×8, setback 1"/course:
6 courses, 48" high, 14 blocks per course (84 total), running bond offset 18" on
even courses, cumulative setback 5" at the top course. Odd courses clip block 14
to 12.00"; even courses open with an 18.00" half block and clip block 14 to
30.00". `deriveWall` is deterministic across repeated calls.

Instance ceiling is 1024. The largest configuration the controls allow, 80' by
10 courses, derives 275 units.

40' × 6, Tumbled Ashlar 36x18x8: 160 sq ft of face, 84 units, 14 caps, 2.6 tons
of gravel, 4 tubes, $2,497 estimated, 39,077.5 lb. Checked by hand: 84 blocks at
3 ft³ plus 14 caps at 1.25 ft³ at 145 lb/ft³ is 39,077.5 lb; a 30" by 6" trench
over 480" is 1.85 yd³, 2.6 tons at 1.4 ton/yd³. At 7 courses the engineered
notice appears and units go to 98. Caps off: the cap line disappears and
adhesive drops from 4 tubes to 2.

All three presets check against the parity rule. 20' × 3 gives 22 units (7 on
odd courses, 8 on even, because the half block that opens an even course adds
one), 7 caps, $758. 60' × 2 gives 41 units, 20 caps, $1,642. 40' × 6 gives 84
units, 14 caps, $2,497.

Panel and scene agree because they read one derivation. `wall.ts` sets
`blockCount: blocks.length` from the array it built, `Wall.tsx` draws that array
with `range={derived.blockCount}`, and `takeoff.ts` bills `qty:
derived.blockCount`. There is no second count anywhere.

A copied link reproduces the wall including a non-first colorway and caps off.
Four sets of junk params fell back to defaults without throwing. 21 of 21 locked
controls are inert and show a lock and an hour estimate.

## Block 2D measurements

At 1440x900 the safe rect is 704x852 at origin (368, 24); at 1280x800 it is
544x752 at the same origin. Symmetric, 368 px of panel plus margin per side.
Wall projected bounding box, fraction of the safe rect:

| Config | Viewport | Box px | of safe W | of safe H |
|---|---|---|---|---|
| Garden wall 20'×3 | 1440×900 | 485×147 | 0.689 | 0.173 |
| Backyard terrace 40'×6 | 1440×900 | 486×141 | 0.690 | 0.165 |
| Driveway edge 60'×2 | 1440×900 | 484×98 | 0.688 | 0.115 |
| Default 24'×4 | 1440×900 | 486×151 | 0.690 | 0.177 |
| Backyard terrace 40'×6 | 1280×800 | 374×109 | 0.688 | 0.145 |

The width fraction is on target at 0.69 in every case and the picture still
fails. That is the second time a width metric has passed while the photograph
was wrong, and it is the argument for 2E.
