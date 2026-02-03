export type EvidenceType = 'video' | 'document' | 'profile' | 'location' | 'system'

export type EvidencePolarity = 'inculpatory' | 'exculpatory' | 'neutral'

export type EvidenceSource = 'court' | 'partner' | 'player' | 'system'

export type JudgePersonality = 'strict' | 'neutral' | 'sympathetic'

export interface Evidence {
  id: string
  title: string
  type: EvidenceType
  summary: string
  details?: string
  discoveredAtMs: number
  source: EvidenceSource
  polarity: EvidencePolarity
  weight: number
  tags?: string[]

  submittedAtMs?: number
  judgeNote?: string
  impactDelta?: number
}

export interface InvestigationTaskTemplate {
  id: string
  title: string
  description: string
  durationSec: number
  resultEvidenceIds: string[]
  requires?: {
    evidenceAnyOf?: string[]
    secondsRemainingLTE?: number
  }
}

export type InvestigationRunStatus = 'running' | 'completed' | 'failed'

export interface InvestigationTaskRun {
  id: string
  templateId: string
  startedAtMs: number
  endsAtMs: number
  status: InvestigationRunStatus
  error?: string
}

export interface ChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  createdAtMs: number
}

export interface JudgeConfig {
  baseUrl: string
  apiKey: string
  modelId: string
  personality: JudgePersonality
  temperature: number
}

export type EndingType = 'executed' | 'acquitted' | 'partial' | 'hidden'

export interface Ending {
  type: EndingType
  title: string
  summary: string
}

export interface ModelState {
  isLoading: boolean
  error?: string
  models: string[]
  lastUpdatedAtMs?: number
}

