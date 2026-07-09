import { isSupabaseEnabled } from '../lib/supabase.js'

// Small indicator of whether the app is syncing to Supabase or running
// purely on localStorage.
export default function CloudBadge() {
  return (
    <span className={`cloud-badge ${isSupabaseEnabled ? 'on' : 'off'}`} title={isSupabaseEnabled ? 'Data syncs to your Supabase project' : 'No Supabase configured — data stays in this browser'}>
      {isSupabaseEnabled ? '☁️ Cloud synced' : '💾 Offline (local)'}
    </span>
  )
}
