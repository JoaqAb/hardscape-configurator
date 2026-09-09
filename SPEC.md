# Hardscape Wall Configurator — Specification

A parametric 3D configurator for segmental retaining walls, with automatic
material takeoff and lead capture.

Written before any code. This document is the single source of truth for scope.

---

## 1. Purpose

The client manufactures and distributes hardscape and masonry products:
retaining walls, pavers, fire pits, fireplaces and stone veneer. Their stated
positioning is helping builders and homeowners choose materials, and today that
happens through a 2D catalog browsed by style and by color.

This is a **pattern demonstration, not a guess at their product**. It applies one
architecture to one product family, and it is built so the family and the
catalog can be swapped without touching the rendering layer.

The pattern:

```
structured configuration state
        |
deterministic geometry and rules
        |
3D representation + quantities + captured lead
```

The primary interaction is **material selection**: choosing a style and a
colorway and seeing it applied in 3D. Dimensions are secondary. Quantities and
an estimate exist to qualify the lead, not to serve as an estimator's tool: this
is a customer-facing sales instrument, not an internal engineering one.

Priorities, in order:

1. It works, with no errors, at a public URL.
2. Selecting a style or colorway is immediate and obviously the main action.
3. The product catalog is data, not code: a different catalog yields a different
   product with no change to the scene.
4. A configured project can be turned into a captured lead.
5. The roadmap is visible inside the product, with effort estimates.

## 2. Non-goals

Not implemented, not researched, no TODOs left behind:

BIM, CAD, real structural calculation, geogrid engineering, authentication,
multi-user, cart, payment gateway, complex PBR textures, imported GLTF models,
drag & drop, undo/redo, i18n, E2E tests.

**Hard rule**: if it is not in this spec, it is not built. It goes into the
locked feature registry (§9) and work continues.

## 3. Stack

- Vite + React + TypeScript
- **React 19** (required: React Three Fiber v9+ depends on it)
- three
- @react-three/fiber
- @react-three/drei
- zustand
- tailwindcss
- @supabase/supabase-js

Clean install, no flags. **`--legacy-peer-deps` and `--force` are forbidden.**
If npm reports a peer dependency conflict, the cause is a React major mismatch:
align react and react-dom to 19 and retry. This is the single risk capable of
consuming an hour. Resolve it *before* writing any application code, and verify
that an empty scene renders and that a production build succeeds.

No `leva`. The control panel is part of the product, not a debug widget.

## 4. Language and units

- All UI copy and code comments in **English** (US client).
- **Canonical internal unit: inches.** The whole model computes in inches.
- Three renders in feet (1 scene unit = 1 foot) to keep the camera in a
  comfortable range. Conversion happens in exactly one place.
- UI displays feet and inches, formatted `12' 6"`.
- Units are never mixed outside `model/units.ts`.

## 5. Architecture

```
config  ->  model (pure functions)  ->  scene   (R3F)
                                    ->  takeoff (quantities + price)
                                    ->  lead    (Supabase)
```

- `model/` imports nothing from three. Pure TypeScript, testable without a canvas.
- `scene/` computes nothing. It consumes what is already derived.
- `takeoff/` consumes the same functions the scene does. If the scene draws 137
  blocks, the takeoff says 137. There cannot be two truths.

## 6. File structure

```
src/
  data/
    catalog.ts           block and cap SKUs (PLACEHOLDER, see §7)
    features.ts          locked/unlocked feature registry (§10)
    pricing.ts           price coefficients (PLACEHOLDER)
  model/
    types.ts             WallConfig, DerivedWall, TakeoffLine
    units.ts             in <-> ft, 12' 6" formatting
    wall.ts              deriveWall(config, catalog) -> DerivedWall
    site.ts              deriveSite(derived) -> terrace footprint and slopes
    takeoff.ts           computeTakeoff(derived, pricing) -> TakeoffLine[]
    rng.ts               deterministic seeded PRNG
  store/
    useConfigurator.ts   zustand, single source of truth
    urlState.ts          config <-> query params
    useViewport.ts       measured safe area, kept out of the config
  scene/
    Scene.tsx            Canvas, lights, Environment, ContactShadows, Bounds
    Wall.tsx             composes courses from DerivedWall
    BlockCourse.tsx      Instances/Instance, one per course
    CapCourse.tsx
    Terrain.tsx          ground plus retained slope
    HumanFigure.tsx      6 ft silhouette for scale
  ui/
    ControlPanel.tsx
    ProductFamilyTabs.tsx
    StyleGrid.tsx
    TakeoffPanel.tsx
    LeadForm.tsx
    LockedControl.tsx    visual wrapper for locked features
    VersionBadge.tsx
  lib/
    supabase.ts
  App.tsx
```

## 7. Catalog (data, not code)

`data/catalog.ts` exports an array of SKUs. Values are placeholders and the file
must open with a visible comment:

```ts
// PLACEHOLDER DATA — replace with the real SKU sheet.
// Nothing in the scene or the takeoff is hardcoded to these values.
```

Wall SKU shape:

```ts
{
  id: string
  name: string          // descriptive style name, see naming rule below
  widthIn: number
  depthIn: number
  heightIn: number
  setbackIn: number     // per-course setback
  pricePerUnit: number
  colorways: { id: string; name: string; hex: string }[]
}
```

**Colorways are required, not optional.** The client's own storefront is browsed
by style *and* by color, and material selection is the primary interaction of
this tool (§1). Every active SKU carries at least three colorways with trade
names (`Charcoal`, `Buff Blend`, `Autumn Sunset`, `Gray Granite`). Style and
colorway are independent axes in the config: changing one must not reset the
other, and an invalid combination must fall back to the SKU's first colorway
rather than throwing.

Three active SKUs with clearly different dimensions (for example 24x18x8,
36x16x6, 18x12x4) so that switching style is visible in both the scene and the
takeoff.

**Naming rule, no exceptions**: SKU names must be *descriptive of texture and
format*, never a real brand or product line from any manufacturer. Use names
like `Chiseled Limestone`, `Weathered Fieldstone`, `Tumbled Ashlar`,
`Linear Ledge`, `Split Face`, `Hand-Hewn Stack`. Real product names from an
existing catalog must not appear anywhere in this repo.

`Outcropping` appeared in this list in an earlier draft and has been removed:
it is itself a manufacturer line. A name being geological is not sufficient; it
also has to be out of use. When in doubt, search the name before shipping it.

The reason is commercial, not legal: we do not know whose catalog the client
actually sells, and shipping a demo pre-filled with a competitor's product line
is a bad first impression. Descriptive names are also the honest signal, since
they make it obvious these are placeholders awaiting the real SKU sheet.

Locked in the style grid, name and color only, three additional descriptive
names following the same rule.

Caps are a separate SKU: `depthIn = blockDepth + 2`, `heightIn = 3`, with a 1"
front overhang.

**Weight is never hardcoded.** It is derived from volume at 145 lb/ft³. Small
but direct evidence that the model computes rather than stores constants.

## 8. Wall geometry

`deriveWall(config)` returns position, rotation and scale for every block.

1. **Courses**: the user picks a course count, not a height. That is how a wall
   is built. Resulting height = `courses * blockHeight`.
2. **Blocks per course**: `ceil(runLengthIn / blockWidthIn)`. The last block of
   each course is clipped in X by partial scale, never left overhanging.
3. **Running bond**: odd courses shift by `blockWidth / 2` in X. Whatever hangs
   outside the run is clipped.
4. **Setback**: each course retreats `setbackIn` in Z relative to the one below,
   cumulatively. This is real construction practice and it is what makes the
   wall read as credible rather than as a grid.
5. **Variation**: per-block Y rotation of ±0.6° and offset of ±0.15", from a
   deterministic PRNG seeded with the block index. Determinism is mandatory: the
   same URL must produce the same wall.
6. **Caps**: a final course of cap pieces, aligned to the front face of the top
   block course, overhang forward.
7. **90° return** (block 2): the wall is two runs, `runA` and optional `runB`,
   joined at a corner. Blocks must not intersect at the corner: run B starts
   offset by run A's depth. The takeoff sums both runs and subtracts the corner
   overlap.
8. **Terrain**: ground plane at the front and a turfed bank of retained earth
   behind the wall, so the wall reads as retaining something rather than as a
   freestanding wall on a lawn. Simple geometry, no mesh deformation. A
   separate slope plane rising to wall height was tried and removed: at every
   camera angle it read as a floating panel. The ground plane is sized so its edge falls on
   the horizon: a visible straight edge where the ground stops is the same
   floating-panel failure in another form. The retained mass is treated the
   opposite way. It is finite, fully in frame, vertical only at the wall, and
   sloping back to grade at 1.5:1 on its rear and both ends. Extending it past
   the frustum was tried in block 2E and removed: earth without an end reads as
   a plateau the wall happens to stand in front of, and it hides the one thing
   the wall is for. What must never be visible is a cut face, not an edge.
   Footprint and slopes derive from the wall in `model/site.ts`.
9. **Human scale**: a flat 6 ft silhouette beside the wall. The cheapest
   existing detail that makes a 3D demo read as professional.

**Performance**: a 40 ft × 6 course wall is several hundred blocks. Use drei's
`<Instances>` / `<Instance>` (instanced rendering, one draw call). Never render
one `<mesh>` per block.

All derivation memoized with `useMemo` on the config. No computation inside
`useFrame`.

## 9. Takeoff

This is a **sales-facing quantities summary**, not an estimator's worksheet. It
exists so a customer can see roughly what their project needs and so the
captured lead arrives qualified. Keep it readable and compact; do not let it
grow into an engineering tool or compete visually with the style and colorway
controls. On desktop it renders as a bar along the bottom of the viewport
rather than as a column (§13), which keeps the width of the frame for the wall.

`computeTakeoff(derived, pricing)` returns lines of `label`, `qty`, `unit`,
`unitPrice`, `total`.

| Line | Formula |
|---|---|
| Wall face area | `runLengthFt * wallHeightFt` |
| Block count per SKU | actual count of rendered instances (same data as the scene) |
| Cap count | `ceil(runLengthIn / capWidthIn)` |
| Base gravel | trench of `blockDepth + 12"` wide × 6" deep × run length; to yd³ (`ft³ / 27`), to tons at 1.4 ton/yd³ |
| Construction adhesive | 1 tube per 20 linear feet of cap joint plus top course, rounded up |
| Estimated total | sum of `qty * unitPrice`, prices from `pricing.ts` (PLACEHOLDER) |
| Total weight | derived from volume at 145 lb/ft³ |

**Engineered wall flag**: if wall height *excluding caps* exceeds 48", show a
prominent notice:
`Walls over 4' typically require an engineered design. We'll flag this for
review.` Informational, blocks nothing.

Caps are excluded from that height on purpose. The `Backyard terrace` preset
sits at exactly 48" of block, and a notice that is on by default demonstrates
nothing. A notice that appears when the seventh course is added demonstrates
that the rule is live.

Every number on screen must trace to a formula in `takeoff.ts`. No magic numbers
in the UI.

## 10. Locked feature registry

`data/features.ts` exports the registry:

```ts
{ id, label, group, locked: true, estimateHours: number }
```

**UI rule, no exceptions: no dead control may look actionable.** Locked items
render through `LockedControl`: reduced opacity, lock icon, `cursor:
not-allowed`, and the hour estimate visible on hover or alongside. A button that
does not respond reads as a bug, not as a roadmap.

The registry renders behind a collapsed header carrying the number of planned
features and their total hours, both derived. One click opens it. The rule
above is about dead controls looking actionable, and a closed disclosure is
neither dead nor pretending. The header is also the stronger statement: it is
the budget of the next phase, in two numbers, above everything else.

**Product family** (top tabs)

| Item | State |
|---|---|
| Retaining Wall | active |
| Patio & Pavers | 6h |
| Steps & Landings | 5h |
| Fire Pit | 3h |
| Fireplace | 5h |
| Stone Veneer & Facade | 8h |

These mirror the client's actual product lines. They are the strongest evidence
that the architecture generalizes beyond the one family that is built.

**Wall style** — three active SKUs plus three locked descriptive names, per §7.

**Geometry** — Curved wall 3h · Terraced / multi-tier 4h · Seat wall with caps
2h · Corner types (inside / outside / 45°) 2h

**Business output** — Export PDF quote 2h · Export takeoff to CSV 1h · Delivery
freight by ZIP 3h · Metric units toggle 1h · Save & share project 2h

**Platform** — White-label multi-tenant catalog 12h · Admin catalog editor 10h

The Platform group matters more than its size suggests. The job posting calls
this a "working SaaS product", which leaves open whether it is for the client
alone or for other suppliers in their industry. These two entries are the
honest, visible answer to that question, and they are only credible because the
catalog is already data rather than code.

**Technical output** — Printable top-down layout sheet 3h · Export to DWG 4h

Design the registry so that enabling a feature means flipping `locked: false`
and writing its logic, with no UI changes. One may need to be unlocked live.

**Wall styles are not in the registry.** A style is catalog data, not a
capability of the tool, so the locked SKUs carry their own hour estimates in
`catalog.ts` and the registry does not repeat them. One number, one home: the
same rule §5 applies to counts.

## 11. Supabase

**The database is already provisioned. Do not create, alter or migrate any
table.** The application only inserts rows.

Project ref: `kxnkrlpvhibkzoktzcgd`

The `public.leads` table exists with this shape:

```
id          uuid        pk, default gen_random_uuid()
created_at  timestamptz not null, default now()
email       text        not null, 3..254 chars
name        text        nullable, <= 120 chars
phone       text        nullable, <= 40 chars
config      jsonb       not null
takeoff     jsonb       not null
estimate    numeric     nullable
```

RLS is enabled. Privileges verified: `anon` holds INSERT only, `authenticated`
holds nothing, and the single policy is `anon can insert leads` (INSERT, `with
check (true)`). There is no select policy for anon, so a failed read is expected
behaviour, not a bug to work around.

Respect the column constraints client-side: validate email length before
submitting, and truncate or reject over-long name and phone values. A constraint
violation must surface as a readable message, never as a raw Postgres error.

Keys in `.env` with the `VITE_` prefix; `.env.example` is committed. The anon
key is public by design: do not treat it as a secret or obfuscate it.

`LeadForm`: email required, name and phone optional. On submit, store config,
takeoff and estimate. Explicit loading, success and error states. **If the
insert fails, show the error. Never fake success.**

## 12. URL state

The full config is serialized into query params and updated with
`replaceState` (do not pollute history). On load, hydrate the store from valid
params; fall back to defaults on invalid params without breaking.

**Out of range counts as invalid.** A param outside the range the controls allow
falls back to the default; it is not clamped. Clamping `courses=-99` to 1
invents an intention the link never carried, and it means a copied link can
quietly reproduce a different wall than the one that was shared, which is the
one thing this feature exists to prevent.

A `Copy link` button. This is the bridge to lead capture: the customer builds
their wall, shares the link, and that link is the lead.

## 13. UI

**Desktop layout is full bleed.** The canvas fills the viewport. Three
elements float above it.

The **control card** sits at the top left, ~320px wide. It holds the primary
interaction of §1 and it is open by default. It carries a collapse control
that slides it out to a narrow rail at the screen edge.

The **takeoff bar** runs along the bottom, full width, around 120px tall: a
horizontal row of figures with the estimated total emphasised at one end. A
sales summary reads at least as well across as it does down (§9), and the
bottom edge is the cheapest space in the frame, because it is foreground
ground. The engineered wall notice appears inside this bar and must stay
prominent.

The **roadmap pill** sits at the top right, collapsed by default, showing a
count of planned features and their total hours. Both numbers are derived
from `features.ts` plus the locked SKUs at render time. Neither is ever
typed as a constant. Expanding opens a scrolling card over the canvas.

Panels are opaque against the scene, not translucent. Text over a rendered
image has to be readable before it is pretty, and `backdrop-filter` over a
WebGL canvas costs a repaint for a decorative gain this section already rules
out. Each is its own scroll container bounded by the viewport. The page never
scrolls.

The scene bleeds under everything and the terrain runs off all four edges of
the viewport. **The wall does not.** The camera fits the wall's bounding box
inside the *safe area*: the viewport minus the control card, minus the takeoff
bar, minus margins. The safe area is measured at runtime, not computed from
constants.

**A persistent layout change refits the camera; a transient overlay does
not.** Collapsing or expanding the control card changes the safe rect and
reframes, exactly once, on the path a dimension change already takes.
Expanding the roadmap does not: a camera that jumps every time a disclosure
opens is worse than a moment of overlap. Nothing about the fit runs per frame.

Full bleed is desktop only. Mobile stays stacked, canvas first, fixed height:
an overlay panel on a 390px screen is the whole screen.

Restrained aesthetic, appropriate for a construction materials manufacturer. No
decorative gradients, no entrance animations. Neutral sans typeface, cool
neutral palette, one accent color.

Scene lighting must be **fully local**. Do not use `<Environment preset="..." />`
or any drei helper that fetches an HDRI or any other asset from a CDN at
runtime: a network dependency that can fail during a live demo is not worth the
marginal quality gain on matte concrete.

Use an explicit rig: a low `ambientLight` for fill, one `directionalLight` as
the key with `castShadow` enabled, and a dim second directional as rim light
from the opposite side.

`<ContactShadows />` was specified here and removed: mounted correctly it
rendered nothing measurable at the wall's base, and the alternatives all cost
more than they bought. A cast shadow that falls toward the camera needs a key
behind the wall, which unlights the face that is the product; anything else adds
a light this rig does not allow. A painted dark strip at the toe would be a
drawing of a shadow, not a shadow, and this file does not ship those.

No SoftShadows, no shadow map tuning beyond setting a sane map size and
adjusting the shadow camera frustum to the wall bounds.

Tone mapping is off (`<Canvas flat>`), with light intensities lowered to
compensate. ACES shifts a rendered block away from the colour of the swatch that
was clicked, and colour fidelity outranks filmic contrast when material
selection is the product (§1).

`<OrbitControls>` with `minPolarAngle` / `maxPolarAngle` so the camera cannot go
below the terrain, and `maxPolarAngle` tight enough that it cannot look straight
down either.

**Default framing.** The wall is the subject. It spans roughly two thirds of the safe
area's width, seen from about 15 degrees above horizontal and about 30 degrees off the face, so that the face, one end, the
running bond and the setback all read at once. That is also how a mason
photographs a finished wall. A high camera shows the top of the retained fill,
which is the one part of the job nobody wants to look at. The camera targets the
wall's bounding box, not the terrain's.

The wall does not fill the frame vertically and cannot: at every configuration
these controls allow, the projected height lands between 0.14 and 0.24 of the
safe area and width is the binding constraint. An earlier draft asked for about
half the height as well, which is unreachable for a 40 ft by 4 ft object without
abandoning the width target. **The vertical field is composed, not filled.**
Lower ground in the foreground, the terrace and its slopes behind, the horizon
above: the wall is the subject of the photograph, not its only content. Fitting
both axes and taking the constraining one stays the rule, because a taller wall
or a narrower frame can make height bind.

Fit the frustum on both axes and take the constraining one. At 1440 by 900 the control card and the takeoff bar leave a safe area around
1050 by 700, which is landscape. It was portrait until block 2E, and a
width-only fit passed at 0.69 while the wall sat as a thin band in a large
empty field. Twice. A metric that can do that is the wrong metric: fit both
axes and take the constraining one.

**No fog.** It was tried to hide the far edge of the ground and it washed the
whole image, for the same reason ACES was dropped: flat matte concrete has
little tonal range to spare. Push the horizon out with a large ground plane
instead. The retained mass gets the opposite treatment: it is finite and it returns to
grade, so it has edges but no cut faces (§8.8). A slab on a table and an
infinite plateau are the same mistake seen from two sides.

Three values have to be distinguishable in frame: the lower ground, the top of
the retained fill, and the wall face. The fill is deliberately darker than the
turf, because the top of the fill must never be the lightest thing in the
picture. If the grade change is only legible from the wall itself, the
separation is not yet enough.

This is measurable and it must be measured. Sample the mean relative
luminance of three named regions of the rendered frame: the wall face, the
turf in front of it, and the top of the retained fill. The wall face must
come out at least 1.4 times the turf, and the top of the fill no more than
0.8 times the turf. Report the three numbers with the sample boxes named. If
the boxes cannot be placed reliably, say so and report the three material
base colours instead. Do not move the boxes until the numbers pass: a metric
that cannot fail is not a metric.

The wall face must be the lightest, highest-contrast object in frame. Keep the
turf muted enough that it does not compete: it is background, and it occupies
more pixels than the product does.

`<Bounds fit clip observe>` to reframe when dimensions change. **Known risk**:
`Bounds` and `OrbitControls` can fight each other, producing jitter or a camera
that fights user input. If that happens, do not spend time tuning it: drop
`Bounds` and compute the camera distance directly from the wall's bounding box,
applied only when dimensions change and not on every render.

`VersionBadge`, discreet, in a corner: `v0.1`. The hours actually invested
belong in the README (§15), stated with their context. On the product a time
stamp reads as an apology offered before the visitor has formed an opinion.

## 14. Presets

Buttons that set the wall's dimensions at once, named in the trade's language:

- `Garden wall — 20' × 3 courses`
- `Backyard terrace — 40' × 6 courses`
- `Driveway edge — 60' × 2 courses`

**Presets set dimensions only.** They must not overwrite the selected style or
colorway. Material selection is the primary interaction (§1), and a preset that
resets it undoes the visitor's main choice in order to change the secondary one.
The names are dimensional for the same reason.

## 15. README (written in block 3)

Short, plain English. Must contain: what it is and the demo link; the three
architecture decisions (scene as a function of state, catalog as data, scene and
takeoff from one model); why instancing; what is placeholder and what is real;
actual time invested; one line noting that `npm audit` reports advisories inside
the deploy tooling (`wrangler` to `miniflare` to `sharp`), which are
devDependencies and never reach the shipped bundle; and an honest paragraph
about having no prior professional Three.js experience, a background in
architecture and drawings, and how it was approached.
