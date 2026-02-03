import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import {
  CASE_ID,
  DEATH_PENALTY_THRESHOLD,
  INITIAL_GUILT,
  caseEvidenceIndex,
  initialEvidence,
  investigationTasks,
} from '../content/case_mercy'
import { chatWithJudge, judgeEvaluateEvidence, listModels, pickModelId } from './llm'
import type {
  ChatMessage,
  Ending,
  Evidence,
  InvestigationTaskRun,
  InvestigationTaskTemplate,
  JudgeConfig,
  ModelState,
} from './types'

type GameState = {
  caseId: string
  startedAtMs: number
  endsAtMs: number
  totalSeconds: number

  guilt: number
  evidence: Evidence[]
  selectedEvidenceIds: Set<string>

  taskTemplates: InvestigationTaskTemplate[]
  taskRuns: InvestigationTaskRun[]

  chat: ChatMessage[]
  judgeConfig: JudgeConfig
  modelState: ModelState

  isEvaluating: boolean
  isChatting: boolean
  ending?: Ending
}

type Action =
  | { type: 'toggle_select'; evidenceId: string }
  | { type: 'clear_select' }
  | { type: 'set_guilt'; guilt: number }
  | { type: 'mark_submitted'; evidenceIds: string[]; judgeNote: string; impactDelta: number }
  | { type: 'add_evidence'; evidence: Evidence[] }
  | { type: 'start_task'; run: InvestigationTaskRun }
  | { type: 'complete_task'; runId: string }
  | { type: 'fail_task'; runId: string; error: string }
  | { type: 'append_chat'; message: ChatMessage }
  | { type: 'set_config'; config: JudgeConfig }
  | { type: 'set_models_loading' }
  | { type: 'set_models'; models: string[] }
  | { type: 'set_models_error'; error: string }
  | { type: 'set_evaluating'; value: boolean }
  | { type: 'set_chatting'; value: boolean }
  | { type: 'set_ending'; ending: Ending | undefined }
  | { type: 'restart'; totalSeconds: number }

const STORAGE_KEY_CONFIG = `${CASE_ID}.judgeConfig.v1`

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function nowMs() {
  return Date.now()
}

function parseTotalSeconds() {
  const params = new URLSearchParams(window.location.search)
  const v = Number(params.get('t'))
  if (Number.isFinite(v) && v >= 60 && v <= 12 * 60 * 60) return Math.floor(v)
  return 90 * 60
}

function safeLoadConfig(): Partial<JudgeConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<JudgeConfig>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistConfig(config: JudgeConfig) {
  try {
    const safe: Partial<JudgeConfig> = {
      baseUrl: config.baseUrl,
      modelId: config.modelId,
      personality: config.personality,
      temperature: config.temperature,
    }
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(safe))
  } catch {
    // ignore
  }
}

function makeSystemMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'system',
    content,
    createdAtMs: nowMs(),
  }
}

function makeUserMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    createdAtMs: nowMs(),
  }
}

function makeAssistantMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    createdAtMs: nowMs(),
  }
}

function computeLocalImpact(args: {
  evidence: Evidence[]
  secondsRemaining: number
  totalSeconds: number
  personality: JudgeConfig['personality']
}) {
  const { evidence, secondsRemaining, totalSeconds, personality } = args
  const timePressure = 1 - secondsRemaining / Math.max(totalSeconds, 1)

  const personalityFactor =
    personality === 'strict' ? 0.85 : personality === 'sympathetic' ? 1.08 : 1
  const strictness = 1 + timePressure * 0.25

  const base = evidence.reduce((sum, e) => {
    const polarity =
      e.polarity === 'exculpatory' ? -1 : e.polarity === 'inculpatory' ? 1 : 0
    const magnitude = e.weight * 0.9
    return sum + polarity * magnitude
  }, 0)

  const timeBias =
    base < 0 ? 1 - timePressure * 0.28 : base > 0 ? 1 + timePressure * 0.22 : 1

  const impactDelta = clamp(base * strictness * timeBias * personalityFactor, -6.5, 6.5)
  const note =
    impactDelta < 0
      ? '证据具有一定解释力，但仍需形成闭环：动机、手段、时间线与第三方佐证。'
      : impactDelta > 0
        ? '证据未能有效排除关键不利事实，且存在新的可疑点。'
        : '证据与核心争点关联度不足。'

  return { impactDelta, note }
}

function computeEnding(args: { guilt: number; evidenceIds: Set<string> }): Ending {
  const { guilt, evidenceIds } = args
  if (guilt >= DEATH_PENALTY_THRESHOLD) {
    return {
      type: 'executed',
      title: '失败处决',
      summary: '罪责概率未能降至阈值以下。音波冲击执行启动。',
    }
  }

  if (evidenceIds.has('mcc-exploit')) {
    return {
      type: 'hidden',
      title: '隐藏结局：系统阴谋',
      summary: '你发现Mercy Court概率计算存在可被操控的漏洞，并将其作为关键证据提交。',
    }
  }

  if (evidenceIds.has('rob-confession') && evidenceIds.has('britt-rescued')) {
    return {
      type: 'acquitted',
      title: '完美清白',
      summary: '你锁定真凶并救出Britt，罪责概率降至阈值以下，判决撤销。',
    }
  }

  return {
    type: 'partial',
    title: '勉强脱罪',
    summary: '你成功降低罪责概率，但关键真相仍未完全闭合。',
  }
}

function initState(totalSeconds: number): GameState {
  const startedAtMs = nowMs()
  const endsAtMs = startedAtMs + totalSeconds * 1000
  const persisted = safeLoadConfig()

  const judgeConfig: JudgeConfig = {
    baseUrl: typeof persisted.baseUrl === 'string' ? persisted.baseUrl : 'https://cli.mmg.bio/v1',
    apiKey: '',
    modelId: typeof persisted.modelId === 'string' ? persisted.modelId : '',
    personality:
      persisted.personality === 'strict' ||
      persisted.personality === 'neutral' ||
      persisted.personality === 'sympathetic'
        ? persisted.personality
        : 'neutral',
    temperature: typeof persisted.temperature === 'number' ? persisted.temperature : 0.2,
  }

  return {
    caseId: CASE_ID,
    startedAtMs,
    endsAtMs,
    totalSeconds,
    guilt: INITIAL_GUILT,
    evidence: initialEvidence(),
    selectedEvidenceIds: new Set<string>(),
    taskTemplates: investigationTasks(),
    taskRuns: [],
    chat: [
      makeSystemMessage(
        'Mercy Capital Court 已启动：你有 90 分钟提交证据将罪责概率降到 92% 以下，否则将被执行。',
      ),
    ],
    judgeConfig,
    modelState: { isLoading: false, models: [] },
    isEvaluating: false,
    isChatting: false,
    ending: undefined,
  }
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'toggle_select': {
      const selected = new Set(state.selectedEvidenceIds)
      if (selected.has(action.evidenceId)) selected.delete(action.evidenceId)
      else selected.add(action.evidenceId)
      return { ...state, selectedEvidenceIds: selected }
    }
    case 'clear_select':
      return { ...state, selectedEvidenceIds: new Set() }
    case 'set_guilt':
      return { ...state, guilt: clamp(action.guilt, 0, 100) }
    case 'mark_submitted': {
      const evidenceSet = new Set(action.evidenceIds)
      const touched = state.evidence.filter((e) => evidenceSet.has(e.id))
      const totalWeight = touched.reduce((sum, e) => sum + Math.max(0.01, e.weight), 0)
      const nextEvidence = state.evidence.map((e) => {
        if (!evidenceSet.has(e.id)) return e
        const portion = totalWeight > 0 ? Math.max(0.01, e.weight) / totalWeight : 1 / touched.length
        return {
          ...e,
          submittedAtMs: nowMs(),
          judgeNote: action.judgeNote,
          impactDelta: Number((action.impactDelta * portion).toFixed(3)),
        }
      })
      return { ...state, evidence: nextEvidence, selectedEvidenceIds: new Set() }
    }
    case 'add_evidence': {
      const known = new Set(state.evidence.map((e) => e.id))
      const merged = [...state.evidence, ...action.evidence.filter((e) => !known.has(e.id))]
      return { ...state, evidence: merged }
    }
    case 'start_task':
      return { ...state, taskRuns: [...state.taskRuns, action.run] }
    case 'complete_task': {
      return {
        ...state,
        taskRuns: state.taskRuns.map((r) =>
          r.id === action.runId ? { ...r, status: 'completed' } : r,
        ),
      }
    }
    case 'fail_task': {
      return {
        ...state,
        taskRuns: state.taskRuns.map((r) =>
          r.id === action.runId ? { ...r, status: 'failed', error: action.error } : r,
        ),
      }
    }
    case 'append_chat':
      return { ...state, chat: [...state.chat, action.message] }
    case 'set_config':
      return { ...state, judgeConfig: action.config }
    case 'set_models_loading':
      return { ...state, modelState: { ...state.modelState, isLoading: true, error: undefined } }
    case 'set_models':
      return {
        ...state,
        modelState: {
          isLoading: false,
          models: action.models,
          lastUpdatedAtMs: nowMs(),
          error: undefined,
        },
      }
    case 'set_models_error':
      return {
        ...state,
        modelState: { ...state.modelState, isLoading: false, error: action.error },
      }
    case 'set_evaluating':
      return { ...state, isEvaluating: action.value }
    case 'set_chatting':
      return { ...state, isChatting: action.value }
    case 'set_ending':
      return { ...state, ending: action.ending }
    case 'restart': {
      const next = initState(action.totalSeconds)
      return { ...next, judgeConfig: state.judgeConfig, modelState: state.modelState }
    }
    default:
      return state
  }
}

export function useGame() {
  const totalSeconds = useMemo(() => parseTotalSeconds(), [])
  const [state, dispatch] = useReducer(reducer, totalSeconds, initState)
  const [now, setNow] = useState(() => nowMs())

  const evidenceIndex = useMemo(() => caseEvidenceIndex(), [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMs()), 200)
    return () => window.clearInterval(id)
  }, [])

  const secondsRemaining = Math.max(0, Math.ceil((state.endsAtMs - now) / 1000))

  const evidenceIds = useMemo(() => new Set(state.evidence.map((e) => e.id)), [state.evidence])

  useEffect(() => {
    if (state.ending) return
    if (secondsRemaining > 0) return

    dispatch({ type: 'set_ending', ending: computeEnding({ guilt: state.guilt, evidenceIds }) })
  }, [evidenceIds, secondsRemaining, state.ending, state.guilt])

  useEffect(() => {
    if (state.ending) return

    const running = state.taskRuns.filter((r) => r.status === 'running')
    if (running.length === 0) return

    for (const run of running) {
      if (now < run.endsAtMs) continue

      const template = state.taskTemplates.find((t) => t.id === run.templateId)
      if (!template) {
        dispatch({ type: 'fail_task', runId: run.id, error: '任务模板不存在' })
        continue
      }

      const newEvidence = template.resultEvidenceIds
        .map((id) => evidenceIndex[id])
        .filter(Boolean)
        .map((e) => ({ ...e, discoveredAtMs: nowMs() }))

      dispatch({ type: 'add_evidence', evidence: newEvidence })
      dispatch({ type: 'complete_task', runId: run.id })
      dispatch({ type: 'append_chat', message: makeSystemMessage(`搭档回传线索：${template.title}`) })
    }
  }, [evidenceIndex, now, state.ending, state.taskRuns, state.taskTemplates])

  const toggleEvidenceSelection = useCallback((evidenceId: string) => {
    dispatch({ type: 'toggle_select', evidenceId })
  }, [])

  const setJudgeConfig = useCallback((config: JudgeConfig) => {
    dispatch({ type: 'set_config', config })
    persistConfig(config)
  }, [])

  const refreshModels = useCallback(async () => {
    const cfg = state.judgeConfig
    dispatch({ type: 'set_models_loading' })
    try {
      const models = await listModels(cfg)
      dispatch({ type: 'set_models', models })
      if (!cfg.modelId || !models.includes(cfg.modelId)) {
        const picked = pickModelId(models, ['gemini', 'gemini 3', 'gpt-5.2', 'gpt-5'])
        if (picked) setJudgeConfig({ ...cfg, modelId: picked })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      dispatch({ type: 'set_models_error', error: msg })
    }
  }, [setJudgeConfig, state.judgeConfig])

  const dispatchTask = useCallback(
    (templateId: string) => {
      if (state.ending) return
      const template = state.taskTemplates.find((t) => t.id === templateId)
      if (!template) return

      const alreadyRunning = state.taskRuns.some((r) => r.status === 'running')
      if (alreadyRunning) {
        dispatch({ type: 'append_chat', message: makeSystemMessage('搭档正在执行任务，无法同时派遣。') })
        return
      }

      const requires = template.requires
      if (requires?.secondsRemainingLTE !== undefined && secondsRemaining > requires.secondsRemainingLTE) {
        dispatch({
          type: 'append_chat',
          message: makeSystemMessage('该任务需要更多线索或更紧迫的时机才会被批准执行。'),
        })
        return
      }

      if (requires?.evidenceAnyOf?.length) {
        const ok = requires.evidenceAnyOf.some((id) => evidenceIds.has(id))
        if (!ok) {
          dispatch({
            type: 'append_chat',
            message: makeSystemMessage('缺少关键线索，任务暂不可派遣。'),
          })
          return
        }
      }

      const startedAtMs = nowMs()
      const run: InvestigationTaskRun = {
        id: crypto.randomUUID(),
        templateId,
        startedAtMs,
        endsAtMs: startedAtMs + template.durationSec * 1000,
        status: 'running',
      }

      dispatch({ type: 'start_task', run })
      dispatch({ type: 'append_chat', message: makeSystemMessage(`已派遣搭档：${template.title}`) })
    },
    [evidenceIds, secondsRemaining, state.ending, state.taskRuns, state.taskTemplates],
  )

  const submitSelectedEvidence = useCallback(async () => {
    if (state.ending) return
    const selected = state.evidence.filter((e) => state.selectedEvidenceIds.has(e.id))
    const notYet = selected.filter((e) => !e.submittedAtMs)
    if (notYet.length === 0) {
      dispatch({ type: 'append_chat', message: makeSystemMessage('所选证据已提交或无效。') })
      dispatch({ type: 'clear_select' })
      return
    }

    dispatch({ type: 'set_evaluating', value: true })
    try {
      const cfg = state.judgeConfig
      const canUseLlm = cfg.apiKey.trim().length > 0 && cfg.modelId.trim().length > 0

      const result = canUseLlm
        ? await judgeEvaluateEvidence({
            config: cfg,
            evidence: notYet,
            currentGuilt: state.guilt,
            initialGuilt: INITIAL_GUILT,
            secondsRemaining,
            totalSeconds: state.totalSeconds,
          })
        : computeLocalImpact({
            evidence: notYet,
            secondsRemaining,
            totalSeconds: state.totalSeconds,
            personality: cfg.personality,
          })

      const nextGuilt = clamp(state.guilt + result.impactDelta, 0, 100)
      dispatch({ type: 'set_guilt', guilt: nextGuilt })
      dispatch({
        type: 'mark_submitted',
        evidenceIds: notYet.map((e) => e.id),
        judgeNote: result.note,
        impactDelta: result.impactDelta,
      })
      dispatch({
        type: 'append_chat',
        message: makeSystemMessage(
          `证据审查完成：${result.note}（Δ ${result.impactDelta >= 0 ? '+' : ''}${result.impactDelta.toFixed(2)}）`,
        ),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      dispatch({ type: 'append_chat', message: makeSystemMessage(`证据审查失败：${msg}`) })
    } finally {
      dispatch({ type: 'set_evaluating', value: false })
    }
  }, [secondsRemaining, state.evidence, state.ending, state.guilt, state.judgeConfig, state.selectedEvidenceIds, state.totalSeconds])

  const sendChat = useCallback(
    async (text: string) => {
      if (state.ending) return
      const trimmed = text.trim()
      if (!trimmed) return

      dispatch({ type: 'append_chat', message: makeUserMessage(trimmed) })
      dispatch({ type: 'set_chatting', value: true })
      try {
        const cfg = state.judgeConfig
        const canUseLlm = cfg.apiKey.trim().length > 0 && cfg.modelId.trim().length > 0
        const reply = canUseLlm
          ? await chatWithJudge({ config: cfg, history: state.chat, userText: trimmed })
          : '（离线）请在“配置”里填写 API Key 并选择模型后再与法官对话。你也可以直接提交证据卡片。'
        dispatch({ type: 'append_chat', message: makeAssistantMessage(reply) })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        dispatch({ type: 'append_chat', message: makeAssistantMessage(`（错误）${msg}`) })
      } finally {
        dispatch({ type: 'set_chatting', value: false })
      }
    },
    [state.chat, state.ending, state.judgeConfig],
  )

  const finalize = useCallback(() => {
    if (state.ending) return
    dispatch({ type: 'set_ending', ending: computeEnding({ guilt: state.guilt, evidenceIds }) })
  }, [evidenceIds, state.ending, state.guilt])

  const restart = useCallback(() => {
    dispatch({ type: 'restart', totalSeconds })
  }, [totalSeconds])

  const quickPrompts = useMemo(() => {
    if (state.ending) return []
    if (secondsRemaining <= 8 * 60) {
      return ['我申请最后陈述。', '请说明当前最致命的不利证据是什么？', '我现在提交哪类证据最有效？']
    }
    return ['我申请调取案发窗口的监控全量时间线。', '我申请核验嫌疑人不在场证明。', '请说明我需要降低多少概率才免死？']
  }, [secondsRemaining, state.ending])

  return {
    caseId: state.caseId,
    totalSeconds: state.totalSeconds,
    secondsRemaining,

    guilt: state.guilt,
    evidence: state.evidence,
    selectedEvidenceIds: state.selectedEvidenceIds,

    taskTemplates: state.taskTemplates,
    taskRuns: state.taskRuns,

    chat: state.chat,
    judgeConfig: state.judgeConfig,
    modelState: state.modelState,

    isEvaluating: state.isEvaluating,
    isChatting: state.isChatting,
    ending: state.ending,

    toggleEvidenceSelection,
    submitSelectedEvidence,
    dispatchTask,
    sendChat,
    refreshModels,
    setJudgeConfig,
    restart,

    canFinalize: state.guilt < DEATH_PENALTY_THRESHOLD,
    finalize,
    quickPrompts,
  }
}
