import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage } from '../lib/types'

export function ChatDrawer(props: {
  messages: ChatMessage[]
  onSend: (text: string) => void
  disabled: boolean
  isChatting: boolean
  quickPrompts: string[]
}) {
  const [open, setOpen] = useState(true)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  const display = useMemo(() => props.messages.slice(-30), [props.messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [display.length])

  return (
    <div className="chatDock" aria-live="polite">
      <button
        type="button"
        className={clsx('chatHandle', 'glass')}
        onClick={() => setOpen((v) => !v)}
      >
        AI 对话 · Judge Maddox
        <span className="chatHandleHint">{open ? '收起' : '展开'}</span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="drawer"
            className={clsx('chatDrawer', 'glass')}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="chatMessages">
              {display.map((m) => (
                <div key={m.id} className={clsx('chatMsg', m.role)}>
                  <div className="chatBubble">{m.content}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {props.quickPrompts.length ? (
              <div className="chatQuick">
                {props.quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={clsx('chip', 'glassBtn')}
                    disabled={props.disabled}
                    onClick={() => props.onSend(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              className="chatInputRow"
              onSubmit={(e) => {
                e.preventDefault()
                if (props.disabled) return
                const v = text.trim()
                if (!v) return
                props.onSend(v)
                setText('')
              }}
            >
              <input
                className="chatInput"
                value={text}
                disabled={props.disabled}
                placeholder={props.disabled ? '审判已结束' : '输入你的陈述/请求…'}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" className={clsx('btn', 'glassBtn')} disabled={props.disabled}>
                {props.isChatting ? '…' : '发送'}
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

