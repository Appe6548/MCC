import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${pad2(m)}:${pad2(s)}`
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function mixColor(a: [number, number, number], b: [number, number, number], t: number) {
  return `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(
    lerp(a[2], b[2], t),
  )})`
}

export function CountdownPill(props: { totalSeconds: number; secondsRemaining: number }) {
  const progress = 1 - props.secondsRemaining / Math.max(1, props.totalSeconds)
  const t = clamp01(progress)
  const timeText = formatClock(props.secondsRemaining)

  const bg = useMemo(() => {
    const yellow: [number, number, number] = [255, 204, 0]
    const orange: [number, number, number] = [255, 122, 0]
    const red: [number, number, number] = [255, 59, 48]
    const mid = t < 0.6 ? mixColor(yellow, orange, t / 0.6) : mixColor(orange, red, (t - 0.6) / 0.4)
    return `linear-gradient(90deg, rgba(255,255,255,0.10), ${mid})`
  }, [t])

  return (
    <div className="pill glass pillCountdown" style={{ background: bg }}>
      <div className="pillLabel">倒计时</div>
      <div className="pillValue">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={timeText}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {timeText}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

