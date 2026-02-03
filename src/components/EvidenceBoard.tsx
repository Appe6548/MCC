import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { Evidence } from '../lib/types'
import { EvidenceCard } from './EvidenceCard'

export function EvidenceBoard(props: {
  evidence: Evidence[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSubmitSelected: () => void
  canSubmit: boolean
  isEvaluating: boolean
  canFinalize: boolean
  onFinalize: () => void
}) {
  const selectedCount = props.selectedIds.size
  const submittedCount = props.evidence.filter((e) => e.submittedAtMs).length

  return (
    <section className="board glass">
      <div className="boardHeader">
        <div>
          <div className="boardTitle">证据链</div>
          <div className="boardSub">
            已提交 {submittedCount} / {props.evidence.length} · 已选 {selectedCount}
          </div>
        </div>

        <div className="boardActions">
          <button
            type="button"
            className={clsx('btn', 'glassBtn', 'finalizeBtn')}
            onClick={props.onFinalize}
            disabled={!props.canFinalize}
            title={props.canFinalize ? '申请宣判（结束审判）' : '需将罪责概率降至 92% 以下'}
          >
            申请宣判
          </button>

          <motion.button
            type="button"
            className={clsx('btn', 'submitBtn')}
            onClick={props.onSubmitSelected}
            disabled={!props.canSubmit}
            animate={props.isEvaluating ? { opacity: 0.7 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {props.isEvaluating ? '审查中…' : '提交证据'}
          </motion.button>
        </div>
      </div>

      <div className="boardGrid" role="list">
        {props.evidence.map((e) => (
          <EvidenceCard
            key={e.id}
            evidence={e}
            selected={props.selectedIds.has(e.id)}
            onToggle={props.onToggleSelect}
          />
        ))}
      </div>
    </section>
  )
}

