import { useId } from 'react'

// Sesha — a cute, glossy "3D-style" graduation owl mascot (pure inline SVG,
// self-contained). Gradient IDs are namespaced per instance so multiple
// mascots on the page don't clash.
export default function SeshaMascot({ size = 64, className = '', bob = false }) {
  const raw = useId().replace(/[:]/g, '')
  const u = (n) => `${raw}-${n}`
  const url = (n) => `url(#${u(n)})`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${bob ? 'sesha-bob' : ''}`}
      role="img"
      aria-label="Sesha the graduation owl"
    >
      <defs>
        <radialGradient id={u('body')} cx="38%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#b79bff" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        <radialGradient id={u('belly')} cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff5da" />
          <stop offset="100%" stopColor="#f6cf94" />
        </radialGradient>
        <radialGradient id={u('eye')} cx="40%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e7defb" />
        </radialGradient>
        <radialGradient id={u('beak')} cx="50%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <linearGradient id={u('cap')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3730a3" />
          <stop offset="100%" stopColor="#171449" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="50" cy="93" rx="27" ry="5" fill="#4c1d95" opacity="0.22" />

      {/* wings */}
      <path d="M24 52 Q15 66 26 80 Q23 66 30 56 Z" fill="#5b21b6" />
      <path d="M76 52 Q85 66 74 80 Q77 66 70 56 Z" fill="#5b21b6" />

      {/* body */}
      <ellipse cx="50" cy="58" rx="32" ry="32" fill={url('body')} />
      {/* glossy highlight */}
      <ellipse cx="38" cy="42" rx="13" ry="9" fill="#ffffff" opacity="0.22" />

      {/* belly */}
      <ellipse cx="50" cy="66" rx="18" ry="20" fill={url('belly')} />

      {/* feet */}
      <ellipse cx="43" cy="88" rx="5.5" ry="3" fill="#f59e0b" />
      <ellipse cx="57" cy="88" rx="5.5" ry="3" fill="#f59e0b" />

      {/* eyes */}
      <circle cx="40" cy="53" r="12" fill={url('eye')} stroke="#efe9ff" strokeWidth="1.4" />
      <circle cx="60" cy="53" r="12" fill={url('eye')} stroke="#efe9ff" strokeWidth="1.4" />
      <circle cx="41" cy="55" r="5.4" fill="#1e1b4b" />
      <circle cx="59" cy="55" r="5.4" fill="#1e1b4b" />
      <circle cx="38.8" cy="52.6" r="2.1" fill="#ffffff" />
      <circle cx="56.8" cy="52.6" r="2.1" fill="#ffffff" />

      {/* beak */}
      <path d="M46 61 L54 61 L50 69 Z" fill={url('beak')} />

      {/* graduation cap */}
      <path d="M50 6 L76 17 L50 28 L24 17 Z" fill={url('cap')} />
      <path d="M50 28 L50 20 L66 13 L66 20 Q58 26 50 28 Z" fill="#171449" opacity="0.55" />
      <circle cx="50" cy="16.7" r="2.4" fill="#fbbf24" />
      <path d="M50 16.7 Q67 18 67 28" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="67" cy="30.5" r="3" fill="#f59e0b" />
    </svg>
  )
}
