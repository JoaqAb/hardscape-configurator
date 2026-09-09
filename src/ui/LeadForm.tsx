import { useEffect, useRef, useState } from 'react'

import { PRICING } from '../data/pricing'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { computeTakeoff } from '../model/takeoff'
import type { DerivedWall } from '../model/types'
import { formatUsd } from '../model/units'
import { useConfigurator } from '../store/useConfigurator'
import { shareUrlFor } from '../store/urlState'
import { useViewport } from '../store/useViewport'

/** The column limits on public.leads (SPEC §11). Checked before the request
 *  goes out, so a constraint violation never comes back as a Postgres error. */
const EMAIL_MIN = 3
const EMAIL_MAX = 254
const NAME_MAX = 120
const PHONE_MAX = 40

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; email: string }
  | { kind: 'error'; message: string }

type SupabaseError = { message: string; code?: string }

/**
 * Turns what the client can actually distinguish into a sentence. Anything it
 * cannot classify keeps its underlying message rather than being swallowed.
 */
function describe(error: SupabaseError): string {
  const code = error.code ?? ''
  const message = error.message ?? ''

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. The request never left your browser. Check your connection and try again.'
  }
  if (/fetch|network|Load failed/i.test(message)) {
    return `The request could not reach the server, so nothing was saved. Please try again. (${message})`
  }
  if (code === '22001' || code === '23514' || code === '23502') {
    return `The server rejected these details, so nothing was saved: ${message}`
  }
  if (code === '42501' || /row-level security|permission/i.test(message)) {
    return `The server refused the insert, so nothing was saved: ${message}`
  }
  return `The insert did not go through, so nothing was saved: ${message}`
}

function validate(email: string, name: string, phone: string): string | null {
  const trimmed = email.trim()
  if (trimmed.length < EMAIL_MIN) return 'Please enter your email address.'
  if (trimmed.length > EMAIL_MAX)
    return `That email address is too long. The limit is ${EMAIL_MAX} characters.`
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return 'That email address does not look right. Please check it.'
  if (name.trim().length > NAME_MAX)
    return `That name is too long. The limit is ${NAME_MAX} characters.`
  if (phone.trim().length > PHONE_MAX)
    return `That phone number is too long. The limit is ${PHONE_MAX} characters.`
  return null
}

/** Optional columns are nullable, so a blank field is null and not "". */
function orNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function LeadForm({ derived }: { derived: DerivedWall }) {
  const config = useConfigurator((s) => s.config)
  const close = useViewport((s) => s.setLeadFormOpen)
  const card = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    // Both breakpoints mount a form and only one of them is displayed, so the
    // hidden instance must keep its hands off a flag they share. Without this
    // its outside-click handler closed the visible one on every click.
    const isVisible = () => card.current?.offsetParent != null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible()) close(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!isVisible()) return
      if (!card.current?.contains(e.target as Node)) close(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [close])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (status.kind === 'submitting') return

    const problem = validate(email, name, phone)
    if (problem) {
      setStatus({ kind: 'error', message: problem })
      return
    }
    if (!supabase) {
      setStatus({
        kind: 'error',
        message:
          'Lead capture is not configured in this build, so nothing was saved. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing.',
      })
      return
    }

    setStatus({ kind: 'submitting' })
    const lines = computeTakeoff(derived, PRICING)
    const estimate = lines.find((line) => line.unit === 'USD')?.total ?? null

    // shareUrl is derived from the config, and it is stored beside it on
    // purpose: SPEC §12 makes the link the lead, so whoever opens this row
    // should be able to open the wall it describes.
    const { error } = await supabase.from('leads').insert({
      email: email.trim(),
      name: orNull(name),
      phone: orNull(phone),
      config: { ...config, shareUrl: shareUrlFor(config) },
      takeoff: lines,
      estimate,
    })

    if (error) {
      setStatus({ kind: 'error', message: describe(error) })
      return
    }
    setStatus({ kind: 'success', email: email.trim() })
  }

  const lines = computeTakeoff(derived, PRICING)
  const total = lines.find((line) => line.unit === 'USD')
  const busy = status.kind === 'submitting'

  return (
    <div
      ref={card}
      role="dialog"
      aria-label="Send me this estimate"
      className="pointer-events-auto w-80 max-h-full overflow-y-auto rounded-lg border border-stone-200 bg-white p-4 shadow-xl"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">
          Send me this estimate
        </h2>
        <button
          type="button"
          onClick={() => close(false)}
          title="Close"
          className="shrink-0 rounded border border-stone-200 px-1.5 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700"
        >
          ×
        </button>
      </div>

      {status.kind === 'success' ? (
        <div className="space-y-2 text-xs text-stone-700">
          <p className="font-medium text-stone-900">Thank you.</p>
          <p>
            We have your project and we will send the estimate to{' '}
            <span className="font-medium">{status.email}</span>.
          </p>
          <p className="text-stone-500">
            Your wall is still on screen. You can keep changing it and send
            another version.
          </p>
        </div>
      ) : (
        // noValidate on purpose: the browser's own constraint bubbles fire
        // before this handler and speak the browser's language, which left
        // every email error in a different tongue from the rest of the UI and
        // made the checks in validate() unreachable. Validation is ours.
        <form onSubmit={submit} noValidate className="space-y-3">
          <p className="text-xs text-stone-500">
            {total
              ? `We will send this ${formatUsd(total.qty)} estimate and the wall you built.`
              : 'We will send the estimate and the wall you built.'}
          </p>

          <label className="block">
            <span className="text-xs font-medium text-stone-700">Email</span>
            <input
              type="email"
              required
              maxLength={EMAIL_MAX}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5 text-xs text-stone-800 outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-stone-700">
              Name <span className="font-normal text-stone-400">optional</span>
            </span>
            <input
              type="text"
              maxLength={NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5 text-xs text-stone-800 outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-stone-700">
              Phone <span className="font-normal text-stone-400">optional</span>
            </span>
            <input
              type="tel"
              maxLength={PHONE_MAX}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5 text-xs text-stone-800 outline-none focus:border-accent"
            />
          </label>

          {status.kind === 'error' && (
            <p
              role="alert"
              className="rounded border border-red-300 bg-red-50 px-2 py-1.5 text-[11px] leading-snug text-red-800"
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-accent px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send it'}
          </button>

          {!isSupabaseConfigured && (
            <p className="text-[11px] leading-snug text-stone-500">
              Lead capture is not configured in this build. Everything else on
              the page still works.
            </p>
          )}
        </form>
      )}
    </div>
  )
}
