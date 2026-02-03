import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { JudgeConfig, ModelState } from '../lib/types'

export function ConfigModal(props: {
  value: JudgeConfig
  modelState: ModelState
  onRefreshModels: () => Promise<void>
  onChange: (next: JudgeConfig) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState('')
  const filteredModels = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return props.modelState.models
    return props.modelState.models.filter((m) => m.toLowerCase().includes(q))
  }, [filter, props.modelState.models])

  const cfg = props.value

  return (
    <motion.div className="modalBackdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className={clsx('modal', 'glass')}
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div className="modalHeader">
          <div>
            <div className="modalTitle">AI 法官配置</div>
            <div className="modalSub">支持 OpenAI 兼容接口（例如 `https://cli.mmg.bio/v1`）。</div>
          </div>
          <button type="button" className={clsx('btn', 'glassBtn')} onClick={props.onClose}>
            关闭
          </button>
        </div>

        <div className="modalGrid">
          <label className="field">
            <div className="fieldLabel">Base URL</div>
            <input
              className="fieldInput"
              value={cfg.baseUrl}
              placeholder="https://cli.mmg.bio/v1"
              onChange={(e) => props.onChange({ ...cfg, baseUrl: e.target.value })}
            />
          </label>

          <label className="field">
            <div className="fieldLabel">API Key</div>
            <input
              className="fieldInput"
              value={cfg.apiKey}
              type="password"
              placeholder="输入你的 API Key（不会写入仓库）"
              onChange={(e) => props.onChange({ ...cfg, apiKey: e.target.value })}
            />
          </label>

          <div className="field fieldWide">
            <div className="fieldLabelRow">
              <div className="fieldLabel">模型</div>
              <div className="fieldActions">
                <button
                  type="button"
                  className={clsx('btn', 'glassBtn')}
                  disabled={props.modelState.isLoading}
                  onClick={props.onRefreshModels}
                >
                  {props.modelState.isLoading ? '刷新中…' : '刷新模型列表'}
                </button>
              </div>
            </div>

            <div className="chipsRow">
              <button
                type="button"
                className={clsx('chip', 'glassBtn')}
                onClick={() => props.onChange({ ...cfg, modelId: 'gemini' })}
                title="若你的模型列表中包含 Gemini，会自动匹配"
              >
                Gemini（默认）
              </button>
              <button
                type="button"
                className={clsx('chip', 'glassBtn')}
                onClick={() => props.onChange({ ...cfg, modelId: 'gpt-5.2' })}
                title="若你的模型列表中包含 GPT-5.2，会自动匹配"
              >
                GPT-5.2
              </button>
            </div>

            <div className="modelRow">
              <input
                className="fieldInput"
                value={filter}
                placeholder="搜索模型（可选）"
                onChange={(e) => setFilter(e.target.value)}
              />
              <select
                className="fieldSelect"
                value={cfg.modelId}
                onChange={(e) => props.onChange({ ...cfg, modelId: e.target.value })}
              >
                <option value="">（未选择）</option>
                {filteredModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {props.modelState.error ? <div className="fieldError">模型列表错误：{props.modelState.error}</div> : null}
          </div>

          <label className="field">
            <div className="fieldLabel">性格</div>
            <select
              className="fieldSelect"
              value={cfg.personality}
              onChange={(e) => props.onChange({ ...cfg, personality: e.target.value as JudgeConfig['personality'] })}
            >
              <option value="strict">strict</option>
              <option value="neutral">neutral</option>
              <option value="sympathetic">sympathetic</option>
            </select>
          </label>

          <label className="field">
            <div className="fieldLabel">Temperature</div>
            <input
              className="fieldInput"
              type="number"
              min={0}
              max={1.2}
              step={0.1}
              value={cfg.temperature}
              onChange={(e) => props.onChange({ ...cfg, temperature: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="modalFoot">
          <div className="modalHint">
            提示：如果模型列表不可用（CORS/鉴权），仍可离线体验；“提交证据”会使用本地评估算法。
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

