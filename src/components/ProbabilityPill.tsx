import { useMemo } from 'react'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function ProbabilityPill(props: { guilt: number }) {
  const guilt = clamp(props.guilt, 0, 100)
  const colorClass = guilt >= 97 ? 'danger' : guilt >= 92 ? 'warn' : 'safe'

  const ring = useMemo(() => {
    const r = 18
    const c = 2 * Math.PI * r
    const pct = guilt / 100
    return { r, c, offset: c * (1 - pct) }
  }, [guilt])

  return (
    <div className={`pill glass pillGuilt ${colorClass}`}>
      <div className="pillLabel">罪责概率</div>
      <div className="pillGuiltMain">
        <div className="pillValue">{guilt.toFixed(1)}%</div>
        <svg className="ring" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle className="ringBg" cx="22" cy="22" r={ring.r} />
          <circle
            className="ringFg"
            cx="22"
            cy="22"
            r={ring.r}
            strokeDasharray={ring.c}
            strokeDashoffset={ring.offset}
          />
        </svg>
      </div>
    </div>
  )
}

