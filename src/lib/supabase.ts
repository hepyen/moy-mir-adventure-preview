import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Both values are public client configuration, never a service-role or secret key.
// GitHub Actions builds without the local .env; a public fallback prevents
// releasing an OTA that cannot initialize family authentication.
const projectUrl = 'https://ueqtitxbvsnqmbudwxwu.supabase.co';
const publicClientKey = 'sb_publishable_qWop6aV_TzUgWwn_0YCCzg_QzstXqKQ';
const url = import.meta.env.VITE_SUPABASE_URL || projectUrl;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || publicClientKey;

export const supabase: SupabaseClient = createClient(url, anonKey);
