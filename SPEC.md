# Hardscape Wall Configurator — Specification

A parametric 3D configurator for segmental retaining walls, with automatic
material takeoff and lead capture.

Written before any code. This document is the single source of truth for scope.

---

## 1. Purpose

The client is a wet cast concrete hardscape manufacturer. Their sales process
depends on **project takeoffs**: a contractor or homeowner describes a wall, and
someone on the team counts the blocks, caps, base gravel and adhesive by hand,
then quotes it. That manual step is the bottleneck between an inquiry and a
sale.

This tool demonstrates that the 3D scene and the commercial takeoff can come
from the **same data model**. The scene is a consequence of the configuration
state, not the place where the logic lives.

Priorities, in order:

1. It works, with no errors, at a public URL.
2. The takeoff is correct and consistent with what is on screen.
3. The product catalog is data, not code.
4. The roadmap is visible inside the product, with effort estimates.

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
    takeoff.ts           computeTakeoff(derived, pricing) -> TakeoffLine[]
    rng.ts               deterministic seeded PRNG
  store/
    useConfigurator.ts   zustand, single source of truth
    urlState.ts          config <-> query params
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
  name: string          // commercial name
  widthIn: number
  depthIn: number
  heightIn: number
  colorHex: string
  setbackIn: number     // per-course setback
  pricePerUnit: number
  locked: boolean
}
```

Three active SKUs with clearly different dimensions (for example 24x18x8,
36x16x6, 18x12x4) so that switching style is visible in both the scene and the
takeoff.

Locked in the style grid, name and color only: Belvedere, Outcropping,
Heartwood, Grand Ledge, Claremont.

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
8. **Terrain**: ground plane at the front; behind the wall, a slope rising to
   wall height. Simple geometry, no mesh deformation.
9. **Human scale**: a flat 6 ft silhouette beside the wall. The cheapest
   existing detail that makes a 3D demo read as professional.

**Performance**: a 40 ft × 6 course wall is several hundred blocks. Use drei's
`<Instances>` / `<Instance>` (instanced rendering, one draw call). Never render
one `<mesh>` per block.

All derivation memoized with `useMemo` on the config. No computation inside
`useFrame`.

## 9. Takeoff

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

**Engineered wall flag**: if height exceeds 48", show a prominent notice:
`Walls over 4' typically require an engineered design. We'll flag this for
review.` Informational, blocks nothing.

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

**Product family** (top tabs)

| Item | State |
|---|---|
| Retaining Wall | active |
| Patio & Pavers | 6h |
| Steps & Landings | 5h |
| Fire Pit | 3h |

**Wall style** — three active SKUs plus the five locked names from §7.

**Geometry** — Curved wall 3h · Terraced / multi-tier 4h · Seat wall with caps
2h · Corner types (inside / outside / 45°) 2h

**Business output** — Export PDF quote 2h · Export takeoff to CSV 1h · Delivery
freight by ZIP 3h · Metric units toggle 1h · Save & share project 2h

Design the registry so that enabling a feature means flipping `locked: false`
and writing its logic, with no UI changes. One may need to be unlocked live.

## 11. Supabase

Single table:

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null,
  name text,
  phone text,
  config jsonb not null,
  takeoff jsonb not null,
  estimate numeric
);

alter table leads enable row level security;

create policy "anon can insert leads"
  on leads for insert to anon with check (true);
```

No select policy for anon. Insert only.

Keys in `.env` with the `VITE_` prefix; `.env.example` is committed. The anon
key is public by design: do not treat it as a secret or obfuscate it.

`LeadForm`: email required, name and phone optional. On submit, store config,
takeoff and estimate. Explicit loading, success and error states. **If the
insert fails, show the error. Never fake success.**

## 12. URL state

The full config is serialized into query params and updated with
`replaceState` (do not pollute history). On load, hydrate the store from valid
params; fall back to defaults on invalid params without breaking.

A `Copy link` button. This is the bridge to lead capture: the customer builds
their wall, shares the link, and that link is the lead.

## 13. UI

Desktop: control panel left (~320px fixed), canvas center, takeoff panel right
(~320px). Mobile: stacked, canvas first, fixed height.

Restrained aesthetic, appropriate for a construction materials manufacturer. No
decorative gradients, no entrance animations. Neutral sans typeface, cool
neutral palette, one accent color.

Scene: `<Environment preset="city" />` plus `<ContactShadows />`. No SoftShadows,
no shadow map tuning. `<OrbitControls>` with `minPolarAngle` / `maxPolarAngle`
so the camera cannot go below the terrain. `<Bounds fit clip observe>` to
reframe when dimensions change.

`VersionBadge`, discreet, in a corner: `v0.1 · built in one evening`.

## 14. Presets

Buttons that set the whole config at once, named in the trade's language:

- `Garden wall — 20' × 3 courses`
- `Backyard terrace — 40' × 6 courses`
- `Driveway edge — 60' × 2 courses`

## 15. README (written in block 3)

Short, plain English. Must contain: what it is and the demo link; the three
architecture decisions (scene as a function of state, catalog as data, scene and
takeoff from one model); why instancing; what is placeholder and what is real;
actual time invested; and an honest paragraph about having no prior professional
Three.js experience, a background in architecture and drawings, and how it was
approached.
