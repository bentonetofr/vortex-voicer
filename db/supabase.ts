import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !secretKey) throw new SupabaseConfigError();

  adminClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetch.bind(globalThis),
      headers: { 'X-Client-Info': 'vortex-voice-sites' },
    },
  });
  return adminClient;
}

export function getAudioBucket() {
  return process.env.SUPABASE_AUDIO_BUCKET?.trim() || 'vortex-round-audio';
}

export class SupabaseConfigError extends Error {
  constructor() {
    super('supabase_not_configured');
    this.name = 'SupabaseConfigError';
  }
}
