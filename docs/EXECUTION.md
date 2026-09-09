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

Catalog, `deriveWall`, scene with courses, running bond, setback, caps, terrain,
human figure. Controls: run length, courses, style, caps on/off. Camera with
`<Bounds>`.

**Acceptance**
- `npm run build` clean
- changing any control updates the scene with no flicker and no console errors
- the wall reads as a wall: visible staggered joints, perceptible setback
- **deployed to Cloudflare Pages with a working public URL**

The deploy happens here, not at the end. Deploying early removes the risk of
having no link tomorrow.

---

## Block 2 — the differentiator (~2h)

Full takeoff panel, feet-and-inches formatting, 90° return, URL state, presets,
locked feature registry rendered.

**Acceptance**
- takeoff quantities match the instance counts in the scene
- copying the link and opening it in another tab reproduces an identical wall
- no locked control responds to a click, and every one shows a lock and an
  hour estimate

---

## Block 3 — lead capture and polish (~1.5h)

Supabase insert, form, error states, README.

**Acceptance**
- a real insert lands in the `leads` table and is visible in the dashboard
- a network error is surfaced to the user, never swallowed
- README complete per SPEC §15, including actual time invested

---

## If time remains

Unlock features in this order of cost to impact: Export CSV, then Metric toggle,
then Seat wall. **Do not start anything that cannot be finished.**

---

## Standing rules for this repo

- Small, frequent commits with meaningful messages. The commit history is part
  of what gets shown.
- No dead code, no commented-out blocks, no leftover TODOs.
- If something in `SPEC.md` turns out to be wrong or impossible, stop and say
  so. Do not silently substitute a different approach.
