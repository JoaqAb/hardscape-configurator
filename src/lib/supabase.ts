import { createClient } from '@supabase/supabase-js'

/**
 * The lead capture client (SPEC §11).
 *
 * The anon key is public by design: it holds INSERT on `public.leads` and
 * nothing else, so it is shipped in the bundle without obfuscation.
 *
 * Missing configuration must not take the page down. `createClient` throws on
 * an empty URL, so the client is only built when both values are present and
 * the rest of the app carries on without it.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
