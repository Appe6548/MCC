import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { InvestigationTaskRun, InvestigationTaskTemplate } from '../lib/types'

function secondsToClock(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function InvestigationDrawer(props: {
  secondsRemaining: number
  tasks: InvestigationTaskTemplate[]
  runs: InvestigationTaskRun[]
  onDispatch: (templateId: string) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  const running = props.runs.find((r) => r.status === 'running')
  const runningMeta = useMemo(() => {
    if (!running) return null
    const totalMs = Math.max(1, running.endsAtMs - running.startedAtMs)
    const doneMs = clamp(now - running.startedAtMs, 0, totalMs)
    const pct = doneMs / totalMs
    const leftSec = Math.max(0, Math.ceil((running.endsAtMs - now) / 1000))
    return { pct, leftSec }
  }, [now, running])

  return (
    <div className="investDock">
      <button type="button" className={clsx('investHandle', 'glass')} onClick={() => setOpen((v) => !v)}>
        调查派遣 · 搭档 Jaq
        <span className="chatHandleHint">{open ? '收起' : '展开'}</span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.aside
            key="panel"
            className={clsx('investPanel', 'glass')}
            initial={{ x: -18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -18, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="investTop">
              <div className="partnerRow">
                <div className="partnerAvatar" aria-hidden="true" />
                <div className="partnerMeta">
                  <div className="partnerName">Jaq Diallo</div>
                  <div className="partnerSub">
                    {runningMeta ? `任务中 · 返回倒计时 ${secondsToClock(runningMeta.leftSec)}` : '待命中'}
                  </div>
                </div>
              </div>

              {runningMeta ? (
                <div className="progressBar" aria-hidden="true">
                  <div className="progressFill" style={{ width: `${Math.round(runningMeta.pct * 100)}%` }} />
                </div>
              ) : null}
            </div>

            <div className="investList">
              {props.tasks.map((t) => {
                const isCompleted = props.runs.some((r) => r.templateId === t.id && r.status === 'completed')
                const isRunning = running?.templateId === t.id && running.status === 'running'
                const lockedReason = getLockedReason({ template: t, secondsRemaining: props.secondsRemaining })
                const disabled = props.disabled || isCompleted || isRunning || !!lockedReason || !!running
                return (
                  <div key={t.id} className={clsx('investItem', disabled && 'disabled')}>
                    <div className="investItemTop">
                      <div className="investTitle">{t.title}</div>
                      <div className="investTime">{secondsToClock(t.durationSec)}</div>
                    </div>
                    <div className="investDesc">{t.description}</div>
                    <div className="investBottom">
                      <div className="investHint">
                        {isCompleted
                          ? '已完成'
                          : isRunning
                            ? '进行中'
                            : lockedReason
                              ? lockedReason
                              : '可派遣'}
                      </div>
                      <button
                        type="button"
                        className={clsx('btn', 'glassBtn')}
                        disabled={disabled}
                        onClick={() => props.onDispatch(t.id)}
                      >
                        派遣
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function getLockedReason(args: { template: InvestigationTaskTemplate; secondsRemaining: number }) {
  const { template, secondsRemaining } = args
  const req = template.requires
  if (!req) return undefined
  if (req.secondsRemainingLTE !== undefined && secondsRemaining > req.secondsRemainingLTE) return '未解锁（时机）'
  if (req.evidenceAnyOf?.length) return '未解锁（线索）'
  return undefined
}
