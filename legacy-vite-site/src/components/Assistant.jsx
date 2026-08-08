import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ASSISTANT, GREETING, getReply } from '../data/assistant.js'
import { askSeshaAI, seshaAIEnabled } from '../lib/sesha.js'
import SeshaMascot from './SeshaMascot.jsx'

// Turn any page paths the AI mentions (e.g. "/admission") into link buttons.
const PATH_RE = /\/[a-z0-9]+(?:\/[a-z0-9-]+)*/gi
function extractLinks(text) {
  const found = [...new Set((text.match(PATH_RE) || []).filter((p) => p.length > 2))]
  return found.slice(0, 3).map((to) => ({ to, label: `Open ${to}` }))
}

let idSeq = 0
const uid = () => `m${++idSeq}`

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [unread, setUnread] = useState(false)
  const bodyRef = useRef(null)
  const navigate = useNavigate()

  // Seed the greeting the first time it opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: uid(), from: 'bot', ...GREETING }])
    }
  }, [open, messages.length])

  // Auto-scroll to the latest message
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, typing])

  const send = async (raw) => {
    const text = (raw ?? input).trim()
    if (!text) return
    const userMsg = { id: uid(), from: 'user', text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setTyping(true)

    // Try the real AI (Claude via edge function); fall back to the rule-based reply.
    let reply = null
    if (seshaAIEnabled) {
      const history = nextMessages
        .filter((m) => m.from === 'user' || m.from === 'bot')
        .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      const ai = await askSeshaAI(history)
      if (ai) {
        reply = { text: ai, links: extractLinks(ai), chips: ['Admissions', 'Courses', 'Contact'] }
      }
    }
    if (!reply) reply = getReply(text) // offline / not-configured fallback

    setTyping(false)
    setMessages((m) => [...m, { id: uid(), from: 'bot', ...reply }])
    if (!open) setUnread(true)
  }

  const openChat = () => { setOpen(true); setUnread(false) }

  return (
    <>
      {/* Launcher */}
      <button
        className={`asst-fab ${open ? 'hidden' : ''}`}
        onClick={openChat}
        aria-label="Open the SFGC assistant"
      >
        <span className="asst-fab__icon"><SeshaMascot size={34} /></span>
        <span className="asst-fab__label">Ask {ASSISTANT.name}</span>
        {unread && <span className="asst-fab__dot" />}
      </button>

      {/* Chat panel */}
      <div className={`asst-panel ${open ? 'open' : ''}`} role="dialog" aria-label="SFGC assistant">
        <div className="asst-head">
          <div className="asst-head__who">
            <span className="asst-head__avatar"><SeshaMascot size={38} /></span>
            <div>
              <strong>{ASSISTANT.name}</strong>
              <span className="asst-head__status"><i /> SFGC Assistant · online</span>
            </div>
          </div>
          <button className="asst-head__close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>

        <div className="asst-body" ref={bodyRef}>
          {messages.map((m) => (
            <div key={m.id} className={`asst-msg asst-msg--${m.from}`}>
              {m.from === 'bot' && <span className="asst-msg__avatar"><SeshaMascot size={24} /></span>}
              <div className="asst-msg__bubble">
                {m.text.split('\n').map((line, i) => <span key={i} className="asst-line">{line}</span>)}
                {m.links && m.links.length > 0 && (
                  <div className="asst-links">
                    {m.links.map((l) => (
                      <button key={l.to + l.label} className="asst-link" onClick={() => { navigate(l.to); setOpen(false) }}>
                        {l.label} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="asst-msg asst-msg--bot">
              <span className="asst-msg__avatar"><SeshaMascot size={24} /></span>
              <div className="asst-msg__bubble asst-typing"><i /><i /><i /></div>
            </div>
          )}

          {/* Quick replies from the latest bot message */}
          {!typing && (() => {
            const last = [...messages].reverse().find((m) => m.from === 'bot')
            if (!last || !last.chips) return null
            return (
              <div className="asst-chips">
                {last.chips.map((c) => (
                  <button key={c} className="asst-chip" onClick={() => send(c)}>{c}</button>
                ))}
              </div>
            )
          })()}
        </div>

        <form className="asst-input" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about admissions, courses…`}
            aria-label="Message"
          />
          <button type="submit" className="asst-send" aria-label="Send" disabled={!input.trim()}>➤</button>
        </form>
      </div>
    </>
  )
}
