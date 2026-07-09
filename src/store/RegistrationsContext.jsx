import { createContext, useContext, useState, useEffect } from 'react'
import { isSupabaseEnabled } from '../lib/supabase.js'
import { fetchRegistrations, insertRegistration, deleteRegistrationRow, clearRegistrationsTable } from '../lib/db.js'

// Stores event/fest registrations submitted through EventRegisterModal.
// Persisted to localStorage (and Supabase when configured) for admin review.

const KEY = 'sfgc_registrations_v1'
const RegistrationsContext = createContext(null)

function load() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return []
}

export function RegistrationsProvider({ children }) {
  const [registrations, setRegistrations] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(registrations))
    } catch {
      /* ignore */
    }
  }, [registrations])

  // Cloud sync: load registrations from Supabase on mount.
  useEffect(() => {
    if (!isSupabaseEnabled) return
    let active = true
    ;(async () => {
      const rows = await fetchRegistrations()
      if (active && rows !== null) setRegistrations(rows)
    })()
    return () => { active = false }
  }, [])

  // Adds a registration, assigns a unique ticket id, returns that ticket.
  const addRegistration = (data) => {
    const prefix = (data.eventId || 'EVT').replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase()
    const seq = 1001 + registrations.length
    const ticket = `SFGC-${prefix}-${seq}`
    const reg = { ...data, ticket, registeredAt: new Date().toISOString() }
    setRegistrations((list) => [reg, ...list])
    insertRegistration(reg)
    return ticket
  }

  const removeRegistration = (ticket) => {
    setRegistrations((list) => list.filter((r) => r.ticket !== ticket))
    deleteRegistrationRow(ticket)
  }

  const clearAll = () => { setRegistrations([]); clearRegistrationsTable() }

  const getForEvent = (eventId) => registrations.filter((r) => r.eventId === eventId)
  const countForEvent = (eventId) => registrations.filter((r) => r.eventId === eventId).length

  return (
    <RegistrationsContext.Provider
      value={{ registrations, addRegistration, removeRegistration, clearAll, getForEvent, countForEvent }}
    >
      {children}
    </RegistrationsContext.Provider>
  )
}

export function useRegistrations() {
  const ctx = useContext(RegistrationsContext)
  if (!ctx) throw new Error('useRegistrations must be used within RegistrationsProvider')
  return ctx
}
