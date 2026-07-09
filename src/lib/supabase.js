import { createClient } from '@supabase/supabase-js'

// Configure via a .env / .env.local file (see .env.example):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
// When these are absent the app runs in offline mode (localStorage only),
// so it works with or without a Supabase project.

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseEnabled = Boolean(url && anonKey)

export const supabase = isSupabaseEnabled ? createClient(url, anonKey) : null

if (!isSupabaseEnabled && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info('[SFGC] Supabase not configured — running in offline (localStorage) mode.')
}
