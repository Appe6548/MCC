import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { Ending } from '../lib/types'

export function EndingOverlay(props: {
  ending: Ending
  guilt: number
  secondsRemaining: number
  onRestart: () => void
}) {
  const isExecuted = props.ending.type === 'executed'

  return (
    <motion.div
      className={clsx('endingBackdrop', isExecuted && 'executed')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={clsx('endingCard', 'glass')}
        initial={{ y: 14, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 14, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="endingTitle">{props.ending.title}</div>
        <div className="endingSummary">{props.ending.summary}</div>
        <div className="endingStats">
          <div className="stat">
            <div className="statLabel">最终罪责</div>
            <div className="statValue">{props.guilt.toFixed(1)}%</div>
          </div>
          <div className="stat">
            <div className="statLabel">剩余时间</div>
            <div className="statValue">{formatClock(props.secondsRemaining)}</div>
          </div>
        </div>
        <div className="endingActions">
          <button type="button" className={clsx('btn', 'glassBtn')} onClick={props.onRestart}>
            重新开始
          </button>
        </div>

        {isExecuted ? <div className="sonic" aria-hidden="true" /> : null}
      </motion.div>
    </motion.div>
  )
}

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

