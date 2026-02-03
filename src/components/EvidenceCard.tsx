import clsx from 'clsx'
import type { Evidence } from '../lib/types'

const typeLabel: Record<Evidence['type'], string> = {
  video: '视频',
  document: '文档',
  profile: '人物',
  location: '地点',
  system: '系统',
}

export function EvidenceCard(props: {
  evidence: Evidence
  selected: boolean
  onToggle: (id: string) => void
}) {
  const e = props.evidence
  const isSubmitted = !!e.submittedAtMs
  const delta = e.impactDelta

  return (
    <button
      type="button"
      className={clsx('evidenceCard', 'glass', props.selected && 'selected', isSubmitted && 'submitted')}
      onClick={() => props.onToggle(e.id)}
    >
      <div className="evidenceTop">
        <div className="evidenceType">{typeLabel[e.type]}</div>
        <div className={clsx('evidencePolarity', e.polarity)}>{polarityLabel(e.polarity)}</div>
      </div>

      <div className="evidenceTitle">{e.title}</div>
      <div className="evidenceSummary">{e.summary}</div>

      <div className="evidenceMeta">
        <div className="evidenceSource">{sourceLabel(e.source)}</div>
        {typeof delta === 'number' ? (
          <div className={clsx('evidenceDelta', delta < 0 ? 'down' : delta > 0 ? 'up' : 'flat')}>
            Δ {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)}
          </div>
        ) : null}
      </div>

      {isSubmitted && e.judgeNote ? <div className="evidenceNote">“{e.judgeNote}”</div> : null}
    </button>
  )
}

function polarityLabel(p: Evidence['polarity']) {
  if (p === 'exculpatory') return '有利'
  if (p === 'inculpatory') return '不利'
  return '中立'
}

function sourceLabel(s: Evidence['source']) {
  if (s === 'court') return '法庭'
  if (s === 'partner') return '搭档'
  if (s === 'player') return '你'
  return '系统'
}

