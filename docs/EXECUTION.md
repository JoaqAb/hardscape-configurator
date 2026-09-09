# Execution plan

Read `SPEC.md` first. It is the source of truth for scope. This file is the
order of work and the acceptance gates.

**Do not advance to the next block until the previous block's acceptance
criteria pass.**

---

## Block 0 — scaffolding

This directory already contains `SPEC.md`, `docs/` and `.env.example`, so Vite
cannot scaffold directly into it without prompting. Scaffold into a temporary
subdirectory and merge:

```bash
npm create vite@latest .scaffold -- --template react-ts
cp -rn .scaffold/. .
rm -rf .scaffold
npm install
```

Then:

1. Verify `react` and `react-dom` are on **19.x**. If not, align them before
   installing anything else.
2. Install: `three @react-three/fiber @react-three/drei zustand @supabase/supabase-js`
3. Install and configure Tailwind.
4. **If npm reports a peer dependency conflict, do not use `--legacy-peer-deps`
   or `--force`.** Diagnose the React major mismatch and fix the versions.
5. Append `.env` to `.gitignore` (Vite's default does not include it).
6. Render an empty `<Canvas>` and confirm `npm run dev` and `npm run build` both
   succeed with no errors.

**Acceptance**: empty canvas renders, production build passes, no peer warnings.

Do not write application code before this passes.

---

## Block 1 — working wall, deployed (~2h)

Work in two stages, with a commit between them. The split is not bureaucracy: it
is what proves the central architectural claim of this project.

**1A — the model, with no three.** Write `data/catalog.ts`, `model/units.ts`,
`model/rng.ts` and `model/wall.ts`. `deriveWall` returns the full array of block
placements. Nothing in `model/` may import from three, @react-three/fiber or
@react-three/drei. Before moving on, verify by hand that a known config produces
sensible counts (course count, blocks per course, cumulative setback, running
bond offsets) and report those numbers.

**1B — the scene.** Scene with courses, running bond, setback, caps, terrain,
human figure. Controls: run length, courses, style, caps on/off. Camera per
SPEC §13.

**Acceptance**
- `npm run build` clean
- changing any control updates the scene with no flicker and no console errors
- the wall reads as a wall: visible staggered joints, perceptible setback
- **deployed to Cloudflare with a working public URL**

The deploy happens here, not at the end. Deploying early removes the risk of
having no link tomorrow.

**Cloudflare Pages no longer exists as a separate product.** It has been folded
into Workers static assets: `wrangler pages project create` provisions a Worker
and deploys it in the same step, `wrangler pages project list` comes back empty,
and a subsequent `pages deploy` fails with "project does not exist". This is
expected. The redeploy command is `npx wrangler deploy`. Do not chase a legacy
Pages project with `--force`: the requirement is a public URL, not a particular
Cloudflare product, and forcing a deprecated one is the wrong direction.

A freshly created `workers.dev` subdomain takes a minute or two to provision
TLS. Until then `curl` fails with a handshake error, not a 4xx.

---

## Block 2 — the differentiator (~2h)

Full takeoff panel, feet-and-inches formatting, 90° return, URL state, presets,
locked feature registry rendered.

Run in three stages, ordered by value per unit of risk, not by how impressive
they look:

**2A — takeoff.** `data/pricing.ts`, `model/takeoff.ts`, `TakeoffLine` in
`model/types.ts`, feet-and-inches formatting in `model/units.ts`,
`ui/TakeoffPanel.tsx`. Model first with no three imports, the same split that
worked in 1A/1B. This is the acceptance criterion the whole block is named for.

**2B — registry, presets, URL state.** `LockedControl`, `ProductFamilyTabs`,
locked styles in `StyleGrid`, `VersionBadge`, the three presets of §14,
`store/urlState.ts`. Cheap, low risk, and it is what makes the demo look
finished. Requires the config to live in the zustand store; if it does not yet,
move it there first.

**2C — presentation pass.** The camera, the terrain and the left column. Nothing
new is modelled; what exists is made to read. This was originally the 90°
return, and it was reordered after looking at a screenshot of the deployed app:
the wall occupied roughly a sixth of the canvas, seen from high enough that the
visitor mostly saw the top of the retained fill, and the `Copy link` button sat
below the fold. A second run of blocks added to that scene would have added
nothing a visitor could see. **The demo is judged on the first screenshot, so
the first screenshot is a deliverable.**

**2D: full-bleed layout.** The three column page becomes a full-bleed canvas
with the two panels floating over it. Layout only: no geometry, no lighting, no
camera rule changes. It runs before block 3 because it changes the shape of the
area the camera has to fill, and fitting a camera to a canvas that is about to
be replaced is work done twice. It also retires the ground plane's visible edge
at no cost, since the terrain now runs off every edge of the viewport.

**2E: legibility pass.** The takeoff moves to a bottom bar, the roadmap
collapses into a derived header, the control card gains a collapse control,
and the badge loses its tagline. It also absorbs the four scene fixes that
used to open block 3, plus the value separation between ground, fill and wall
face. 2D fitted the wall correctly into a safe area that was too small and too
portrait; this block fixes the safe area rather than the fit. After it, the
scene is done and block 3 is lead capture and README only.

**The 90° return moves out of block 2** and into `If time remains`, and enters
the locked registry now (`90-degree-return`, geometry, 2h) so the roadmap is
honest whether or not it gets built. It is real geometry work and it is worth
doing, but not before the scene it would appear in is worth looking at, and not
before lead capture, which is an acceptance criterion and this is not.

**Acceptance**
- takeoff quantities match the instance counts in the scene
- copying the link and opening it in another tab reproduces an identical wall
- no locked control responds to a click, and every one shows a lock and an
  hour estimate

---

## Block 3 — lead capture and polish (~1.5h)

Supabase insert, form, error states, README. The scene polish that used to
open this block moved into 2E and is closed there.

**Acceptance**
- a real insert lands in the `leads` table and is visible in the dashboard
- a network error is surfaced to the user, never swallowed
- README complete per SPEC §15, including actual time invested

---

## If time remains

Unlock features in this order of cost to impact: the 90° return, then Export
CSV, then Metric toggle, then Seat wall. **Do not start anything that cannot be
finished.** If the 90° return is started and the corner is not clean, revert it
and leave the registry row locked. A locked row with an honest hour estimate is
a better outcome than blocks intersecting at a corner in a live demo.

---

## Standing rules for this repo

- **Every block that changes what a visitor sees ends with a redeploy.** The
  public URL is the deliverable, and a URL that lags the repo by two blocks is
  worse than no URL, because it gets shown by accident.
- Small, frequent commits with meaningful messages. The commit history is part
  of what gets shown.
- No dead code, no commented-out blocks, no leftover TODOs.
- If something in `SPEC.md` turns out to be wrong or impossible, stop and say
  so. Do not silently substitute a different approach.
