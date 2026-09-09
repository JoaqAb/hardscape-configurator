/**
 * Opaque, like the panels: it sits over a rendered scene and has to be readable
 * before it is pretty (SPEC §13).
 */
export function VersionBadge() {
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium tracking-wide text-stone-500 lg:static lg:mb-0">
      v0.1 · built in one evening
    </div>
  )
}
