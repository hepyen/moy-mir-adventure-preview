import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// The demo UI works without credentials; production features must not silently use demo state.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
