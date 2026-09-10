# State

Updated at the close of every block. This is the handoff document: it is what a
new session reads to know where the project stands without replaying history.

Keep it short. It records state, not narrative.

---

## Current position

**Block 3A closed.** Commits `b86073c`, `3b93707`. Live. The spec is complete:
every acceptance criterion in `docs/EXECUTION.md` has passed. What remains is
`If time remains`.

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
- Block 2D (full-bleed layout), `f385a3a`, `cb68179`. Canvas at viewport size,
  measured safe area in `store/useViewport.ts`, camera fitted to the safe rect.
- Block 2E (legibility pass), `7f4641b`, `67e6885`. Takeoff moved to a bottom
  bar, roadmap to a derived collapsed pill, control card collapsible, badge
  reduced to `v0.1`, both-axes fit, camera lowered, value separation measured.
- Block 2F (the site), `4875fbb`, `98b0141`. Finite retained landform derived in
  `model/site.ts`, `<ContactShadows />` removed with cause, §13's vertical
  framing target corrected.
- Block 3 (lead capture, mobile page flow, README), `c14ffff`. A real row lands
  in `public.leads`, the error path was exercised by aborting the request, and
  the README is written.
- Block 3A (roadmap integrity), `b86073c`, `3b93707`. The card now accounts for
  all 22 planned items and its column sums to the pill's 85h. Three registry
  labels corrected.
- The 90 degree return is a locked registry row and lives in `If time remains`.
- **Next**: block 4, in `If time remains` order but reordered by risk. 4A is the
  90 degree return, hard timeboxed, with the revert criterion in EXECUTION. 4B
  is a visual pass over whatever geometry 4A leaves behind. Revertible risk
  first, then the work that cannot fail badly.

## Where the scene landed

2E extended the retained bank until its edges left the frustum and produced
earth with no end. 2F reversed that for the retained mass only. The rule was
never "no visible edge", it is **no visible cut face**, and real soil satisfies
it by sloping back to grade. The ground plane still runs to the horizon; the
mass the wall holds is finite, fully in frame, and reads as a terrace the wall
created.

The scene is closed. Do not reopen it in block 3.

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

`oxlint` exits 0 with zero warnings. The old `react/immutability` false positive
in `Scene.tsx` disappeared in 2E when camera placement moved to a module-level
function.

Supabase project `kxnkrlpvhibkzoktzcgd`. Table `public.leads` provisioned, RLS
on, `anon` holds INSERT only. `.env` is present and gitignored. **Do not create
or migrate tables.**

Hosting is Cloudflare Workers static assets, not a legacy Pages project: Pages
was folded into Workers. Redeploy with `npx wrangler deploy`. Failure modes are
in `docs/EXECUTION.md`.

Wall config lives in `store/useConfigurator.ts` (zustand) and is read through
selectors. Measured safe area and panel collapse state live in
`store/useViewport.ts`, so neither reaches `urlState`. There is no `useState` in
the app.

## Decisions taken beyond the spec

**Model and catalog**

- Catalog example dimensions are 36x18x8 / 24x16x6 / 18x12x4. The spec's
  original first two had identical volume, so "the largest SKU" was ambiguous.
- Locked SKUs are a **separate type**, not a `WallSku` with `locked: true`. They
  carry no dimensions, so a discriminated union lets the compiler reject passing
  a locked style to `deriveWall`. They carry `estimateHours` in `catalog.ts`;
  the registry holds no wall styles (SPEC §10). One number, one home.
- Style names are descriptive per SPEC §7. The original locked names were real
  manufacturer product lines and were replaced. `Outcropping` is also a real
  line; the active SKU that used it is `Tumbled Ashlar`.
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
- `TakeoffLine.unitPrice` is computed but not rendered.
- The cap line is omitted when caps are off rather than shown as a zero row.

**Config and UI**

- Presets set dimensions only, never style or colorway (SPEC §14).
- Out of range URL params fall back to defaults instead of clamping (SPEC §12).
  One rule for every number.
- Block and cap counts live in the takeoff only. One number, one home.
- `Finished height` and `Copy link` are pinned to the foot of the control card,
  outside its scroll. Anything added to that card must not change that.
- Colorway chips are two per row. Three at 320px truncated `Gray Granite`.
- Panels are opaque, with no `backdrop-filter`.
- Panel collapse is UI state in `useViewport`, never in the URL: §12 serialises
  the wall, and a panel being open is not part of the wall.
- A persistent layout change refits the camera; a transient overlay does not.
  Collapsing the control card reframes; expanding the roadmap does not.
- The takeoff bar is content-sized at 88px rather than the ~120px §13 estimates.
- `ControlPanel` and `VersionBadge` mount once per breakpoint tree rather than
  being portaled, because mobile must keep rendering exactly what 2D shipped
  while desktop was restructured. `RoadmapList` is extracted so the registry has
  one rendering shared by both.
- The lead form is entered from a `Send me this estimate` button beside the
  estimated total, not from a `Request a quote` label: §9 is explicit that this
  is not a quote. Mobile carries its own entry point, because the desktop bar is
  not rendered below the breakpoint.
- `config` jsonb carries the `WallConfig` plus `shareUrl`. It is the one derived
  value stored beside its source, because §12 says the link is the lead and
  whoever opens the row has to be able to open the wall.
- The insert uses `.insert()` with no `.select()`. `anon` holds INSERT only and
  there is no select policy, so asking for the row back fails by design (§11).
- The form is `noValidate` and validation is ours. `type="email" required` fired
  the browser's native bubbles before the submit handler, in the browser's UI
  language, which put Spanish errors in an English UI and made the email checks
  unreachable.
- Both breakpoints mount a `LeadForm` behind one open flag, so the hidden
  instance's outside-click handler was closing the visible one. Each instance
  checks it is the visible one first. This is the cost of the dual-mount
  decision above and it will recur with any future overlay.
- The roadmap card's two subtotal rows are a plain `Subtotal` component, not
  `LockedControl`. They are not controls, they have nothing to lock, and a
  padlock would have added two more things that look like features to a count
  that is exact.

**Scene**

- No fog (SPEC §13). It washed the image, the same failure mode as ACES. The
  ground plane is 4000 ft and puts its edge on the horizon.
- Tone mapping off (`<Canvas flat>`), and one turfed mass instead of a separate
  slope plane. Both are in SPEC §13 and §8.8. Do not re-litigate.
- Pieces are drawn 0.25" undersized (`JOINT_REVEAL_IN`) so every joint reads as
  a shadow line. Layout, counts and takeoff are unaffected.
- The retained fill is darker than the turf on purpose: the top of the fill must
  never be the lightest thing in frame. Measured at 1440x900: wall face over
  turf 1.45, fill top over turf 0.75, against §13 targets of 1.4 and 0.8.
- `Bounds` was dropped for the SPEC §13 fallback: it fought `OrbitControls`.
  The frustum is fitted directly in a `useLayoutEffect` keyed on values.
- The camera frames the wall's own bounding box, not a bounding sphere, and not
  a box that includes the scale figure.
- The safe area is not concentric with the canvas, so the aim point is offset to
  put the wall's centre at the safe area's centre. Off-axis perspective stretches
  the projection, so the fit runs one measured correction pass: project, compare,
  rescale. Two placements per layout change, never per frame. `setViewOffset` was
  rejected because it desynchronises `OrbitControls`.
- `HumanFigure` yaws toward the camera in `useFrame` rather than using drei's
  `<Billboard>`, which leaned the silhouette. It is a flat cutout, so it
  foreshortens at high camera angles, and that reads more now that the wall is
  larger.
- The retained mass is a finite five-face wedge: vertical only at the wall,
  sloping to grade at 1.5:1 on the rear and both ends. Its footprint derives in
  `model/site.ts`, terrace depth `max(10 ft, 3 × finished height)` and slope run
  `1.5 × fill height`. The end slopes are ruled surfaces that converge to a
  vertical line at each end of the wall. A vertical line is not a cut face, and
  widening the base's front edge to remove it would have created one.
- `<ContactShadows />` was removed from §13 with cause, not dropped. drei's blur
  pass renders a `blurPlane` pinned to the world origin through the component's
  own orthographic camera. Offsetting the group or lifting it above grade puts
  that plane outside the frustum and the pass clears the render target instead
  of blurring it, which is why no parameter sweep produced anything. Recentred
  at the origin the blur works, but then the ground plane at y = 0 fills the
  depth pass. With a ground plane at y = 0 there is no position that works.

**Review method**

- Screenshots are a review artifact and the first screenshot is a deliverable.
  Capture the viewport; the page does not scroll, the panels do.
- A pixel probe once reported 0.999 for every configuration because it never
  separated the wall from the bank by colour. Deleted. Any replacement metric
  must be able to report a failure, and the sample boxes do not move until the
  numbers pass.

## Open items

Accepted, no action:

- The control card overflows 740px of frame height on desktop, so `Cap course`
  needs a scroll. The pinned footer is unaffected and the scroll works.
- The `workers.dev` hostname doubles the project name. Cosmetic.
- `docs/reports/2C.md` still describes the deleted pixel probe. Closed record,
  left alone.

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
Four sets of junk params fell back to defaults without throwing. 22 of 22 locked
controls are inert and show a lock and an hour estimate.

Lead capture verified end to end. Row `c6913e1e-a290-422e-85bb-2c1b5876ac65`,
created 2026-09-09 21:28:59 UTC: `config` holds the five `WallConfig` fields
plus `shareUrl`, which reopens the same wall; `takeoff` holds 7 lines; `estimate`
is 2497 and matches the bar. One row per submit, verified against a double
click. Aborting the POST surfaced a readable sentence with the typed values
intact. Over-long name and phone are rejected client-side and never reach
Postgres.

Roadmap pill reads `Roadmap · 22 planned · 85h`, both derived, and the expanded
card accounts for all of it: 14 listed rows at 51h, plus subtotals of 5 product
families at 27h and 3 wall styles at 7h, which live in the tabs and the style
grid. 14 + 5 + 3 = 22 and 51 + 27 + 7 = 85.

## Framing measurements

2D, for the record: safe rect 704x852 at 1440x900, portrait, wall at 0.69 of
safe width and 34 percent of window width. The width fraction was on target and
the photograph was wrong. That is the argument that produced 2E.

2E: safe rect 1048x740 at (368, 24), landscape. Collapsed, 1328x740 at (88, 24).
At 1280x800, 888x640. Wall at 49 percent of window width.

| Config | Viewport | Box px | of safe W | of safe H | Binds |
|---|---|---|---|---|---|
| Garden wall 20'×3 | 1440×900 | 710×173 | 0.677 | 0.234 | width |
| Backyard terrace 40'×6 | 1440×900 | 710×165 | 0.677 | 0.223 | width |
| Driveway edge 60'×2 | 1440×900 | 710×105 | 0.677 | 0.142 | width |
| Default 24'×4 | 1440×900 | 710×178 | 0.677 | 0.241 | width |
| Garden wall 20'×3 | 1280×800 | 602×144 | 0.678 | 0.225 | width |
| Backyard terrace 40'×6 | 1280×800 | 602×137 | 0.678 | 0.214 | width |
| Driveway edge 60'×2 | 1280×800 | 602×87 | 0.678 | 0.136 | width |
| Default 24'×4 | 1280×800 | 602×148 | 0.678 | 0.231 | width |

Width binds in every case, at both viewports, for every configuration the
controls allow. 2F confirmed the table unchanged, and §13's vertical target was
corrected against it: the vertical field is composed, not filled.

Luminance at 1440x900, Backyard terrace, Gray Granite: wall face 0.1164, turf in
front 0.0801, terrace top 0.0608. Wall over turf 1.453 against a target of 1.4,
fill over turf 0.759 against a target of 0.8.

Derived site per preset, from `model/site.ts`:

| Preset | Fill height | Terrace depth | Slope run |
|---|---|---|---|
| Garden wall 20'×3 | 2.00 ft | 10.00 ft (floor) | 3.00 ft |
| Backyard terrace 40'×6 | 4.00 ft | 12.75 ft | 6.00 ft |
| Driveway edge 60'×2 | 1.33 ft | 10.00 ft (floor) | 2.00 ft |
| Default 24'×4 | 2.67 ft | 10.00 ft (floor) | 4.00 ft |

The 10 ft floor binds for three of the four presets.
