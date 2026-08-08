import { supabase, isSupabaseEnabled } from './supabase.js'

// Set to true to use the paid Claude AI (needs the ANTHROPIC_API_KEY secret set
// on the Supabase `sesha` function). Left false → Sesha runs fully free on its
// built-in knowledge base (data/assistant.js).
const AI_ENABLED = false

// Calls the "sesha" Supabase Edge Function (which proxies to Claude).
// Returns the AI reply string, or null if unavailable — callers then fall
// back to the built-in rule-based assistant.

export const seshaAIEnabled = AI_ENABLED && isSupabaseEnabled

export async function askSeshaAI(messages) {
  if (!seshaAIEnabled) return null
  try {
    const { data, error } = await supabase.functions.invoke('sesha', { body: { messages } })
    if (error) return null
    if (data && typeof data.reply === 'string' && data.reply.trim()) return data.reply.trim()
    return null
  } catch {
    return null
  }
}
