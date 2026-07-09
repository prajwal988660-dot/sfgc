import { useEffect, useRef, useState } from 'react'

// Counts from 0 to `value` when scrolled into view. Preserves decimals.
export default function CountUp({ value, suffix = '', duration = 1600 }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState('0')
  const started = useRef(false)

  const decimals = String(value).includes('.') ? String(value).split('.')[1].length : 0
  const target = parseFloat(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now) => {
            const p = Math.min(Math.max((now - start) / duration, 0), 1)
            const eased = 1 - Math.pow(1 - p, 3)
            const current = target * eased
            setDisplay(current.toFixed(decimals))
            if (p < 1) requestAnimationFrame(tick)
            else setDisplay(target.toFixed(decimals))
          }
          requestAnimationFrame(tick)
        }
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [target, decimals, duration])

  const formatted =
    decimals === 0 ? Number(display).toLocaleString('en-IN') : display

  return <span ref={ref}>{formatted}{suffix}</span>
}
