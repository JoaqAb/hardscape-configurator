/**
 * Opaque, like the panels: it sits over a rendered scene and has to be readable
 * before it is pretty (SPEC §13). The hours invested belong in the README, with
 * their context; on the product they read as an apology.
 */
export function VersionBadge() {
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium tracking-wide text-stone-500 lg:static">
      v0.1
    </div>
  )
}
