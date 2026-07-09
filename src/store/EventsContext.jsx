import { createContext, useContext, useState, useEffect } from 'react'
import { EVENTS as SEED } from '../data/home.js'
import { isSupabaseEnabled } from '../lib/supabase.js'
import { fetchEvents, upsertEvent, deleteEventRow, seedEvents } from '../lib/db.js'

// Shared events store. Seeds from the built-in EVENTS, then persists any
// admin changes to localStorage so they survive reloads and appear across
// the Home widget, Events list and Event detail pages.

const KEY = 'sfgc_events_v1'
const EventsContext = createContext(null)

function load() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  return SEED
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(events))
    } catch {
      /* ignore quota / privacy mode */
    }
  }, [events])

  // Cloud sync: on mount, load from Supabase (seed it if the table is empty).
  useEffect(() => {
    if (!isSupabaseEnabled) return
    let active = true
    ;(async () => {
      const rows = await fetchEvents()
      if (!active || rows === null) return
      if (rows.length) setEvents(rows)
      else await seedEvents(SEED) // first run — populate the DB from the seed
    })()
    return () => { active = false }
  }, [])

  const addEvent = (ev) => { setEvents((list) => [...list, ev]); upsertEvent(ev) }
  const updateEvent = (id, patch) => {
    const next = events.map((e) => (e.id === id ? { ...e, ...patch } : e))
    setEvents(next)
    const changed = next.find((e) => e.id === id)
    if (changed) upsertEvent(changed)
  }
  const deleteEvent = (id) => { setEvents((list) => list.filter((e) => e.id !== id)); deleteEventRow(id) }
  const resetEvents = () => { setEvents(SEED); seedEvents(SEED) }
  const getEvent = (id) => events.find((e) => e.id === id)

  return (
    <EventsContext.Provider
      value={{ events, addEvent, updateEvent, deleteEvent, resetEvents, getEvent }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error('useEvents must be used within EventsProvider')
  return ctx
}

// Sort helper — chronological
export function byDate(a, b) {
  return new Date(a.date) - new Date(b.date)
}
