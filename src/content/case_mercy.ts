import type { Evidence, InvestigationTaskTemplate } from '../lib/types'

export const CASE_ID = 'mercy-2026-chris-raven'

export const INITIAL_GUILT = 97.5
export const DEATH_PENALTY_THRESHOLD = 92

const now = () => Date.now()

export function initialEvidence(): Evidence[] {
  const t0 = now()
  return [
    {
      id: 'blood-on-clothes',
      title: '衣物血迹（Nicole）',
      type: 'document',
      summary: '被告衣物检测出受害者血液残留；时间戳与案发窗口高度重合。',
      details: '法庭证物：衣物纤维、血型匹配、实验室报告摘要。',
      discoveredAtMs: t0,
      source: 'court',
      polarity: 'inculpatory',
      weight: 3.2,
      tags: ['dna', 'forensics'],
    },
    {
      id: 'doorbell-footage',
      title: '门铃摄像头：案发时在家',
      type: 'video',
      summary: '门铃摄像头显示被告在案发窗口期间进入/停留于住所附近。',
      details: '法庭证物：时间轴关键帧、进出门记录。',
      discoveredAtMs: t0,
      source: 'court',
      polarity: 'inculpatory',
      weight: 2.6,
      tags: ['video', 'timestamp'],
    },
    {
      id: 'bar-fight-arrest',
      title: '酒吧斗殴拘捕记录',
      type: 'document',
      summary: '案发前后被告卷入斗殴并短暂被拘留；情绪与行为异常被记录在案。',
      discoveredAtMs: t0,
      source: 'court',
      polarity: 'inculpatory',
      weight: 1.4,
      tags: ['incident', 'timeline'],
    },
    {
      id: 'patrick-affair',
      title: 'Patrick Burke：婚外情线索',
      type: 'profile',
      summary: '受害者与Patrick存在亲密关系；具备动机但行踪未明。',
      discoveredAtMs: t0,
      source: 'system',
      polarity: 'neutral',
      weight: 1.2,
      tags: ['suspect', 'motive'],
    },
    {
      id: 'holt-financial-stress',
      title: 'Holt Charles：财务压力与化学品传闻',
      type: 'profile',
      summary: '受害者同事；财务吃紧且与“失窃化学品”传闻有关。',
      discoveredAtMs: t0,
      source: 'system',
      polarity: 'neutral',
      weight: 1.1,
      tags: ['suspect', 'finance'],
    },
    {
      id: 'rob-nelson-profile',
      title: 'Rob Nelson：同事 / AA 赞助人',
      type: 'profile',
      summary: '受害者同事；与Mercy Court历史案件存在关联，背景复杂。',
      discoveredAtMs: t0,
      source: 'system',
      polarity: 'neutral',
      weight: 1.3,
      tags: ['suspect', 'connection'],
    },
  ]
}

export function caseEvidenceIndex(): Record<string, Evidence> {
  const t0 = now()
  const items: Evidence[] = [
    {
      id: 'patrick-alibi',
      title: 'Patrick：不在场证明',
      type: 'document',
      summary: '通话/定位记录与第三方证词支持其案发时不在现场。',
      discoveredAtMs: t0,
      source: 'partner',
      polarity: 'exculpatory',
      weight: 2.2,
      tags: ['alibi'],
    },
    {
      id: 'chemicals-theft',
      title: '失窃化学品：可用于爆炸物',
      type: 'document',
      summary: '实验室化学品被盗；盗取路径与Rob活动轨迹存在重合。',
      discoveredAtMs: t0,
      source: 'partner',
      polarity: 'exculpatory',
      weight: 2.6,
      tags: ['forensics', 'bomb'],
    },
    {
      id: 'britt-social-basement',
      title: 'Britt社媒：地下室的陌生人',
      type: 'video',
      summary: '社交媒体短视频里出现疑似陌生人的身影；位置指向住所地下室。',
      discoveredAtMs: t0,
      source: 'partner',
      polarity: 'exculpatory',
      weight: 2.4,
      tags: ['social', 'kidnapping'],
    },
    {
      id: 'rob-trunk-cctv',
      title: '监控：Rob藏身邻居车辆后备箱',
      type: 'video',
      summary: '社区摄像头捕捉到Rob在案发后潜入邻居车辆并藏入后备箱。',
      discoveredAtMs: t0,
      source: 'partner',
      polarity: 'exculpatory',
      weight: 2.8,
      tags: ['video', 'surveillance'],
    },
    {
      id: 'rob-bomb-materials',
      title: 'Rob住所：爆炸物材料与袭击计划',
      type: 'document',
      summary: '搜查发现爆炸物制作材料、路线草图与法院袭击计划片段。',
      discoveredAtMs: t0,
      source: 'partner',
      polarity: 'exculpatory',
      weight: 3.4,
      tags: ['bomb', 'plan'],
    },
    {
      id: 'rob-confession',
      title: 'Rob供述：嫁祸与绑架',
      type: 'document',
      summary: '关键口供：承认策划嫁祸、谋杀与绑架。',
      discoveredAtMs: t0,
      source: 'system',
      polarity: 'exculpatory',
      weight: 4.6,
      tags: ['confession'],
    },
    {
      id: 'jaq-tampering',
      title: '内部漏洞：搭档隐匿/篡改证据',
      type: 'system',
      summary: '审计日志显示关键证据被人为延迟上传或被不当标注。',
      discoveredAtMs: t0,
      source: 'system',
      polarity: 'exculpatory',
      weight: 3.2,
      tags: ['audit', 'corruption'],
    },
    {
      id: 'mcc-exploit',
      title: 'Mercy Court 漏洞：概率计算可被操控',
      type: 'system',
      summary: '发现概率算法输入校验缺陷，可触发“证据权重溢出”导致系统误判。',
      details: '该结局为玩法彩蛋：揭露系统性问题，而非单一嫌疑人。',
      discoveredAtMs: t0,
      source: 'player',
      polarity: 'exculpatory',
      weight: 2.9,
      tags: ['exploit', 'hidden-ending'],
    },
    {
      id: 'britt-rescued',
      title: 'Britt获救（确认安全）',
      type: 'location',
      summary: '搭档回报：目标已脱离威胁并被护送至安全点。',
      discoveredAtMs: t0,
      source: 'partner',
      polarity: 'exculpatory',
      weight: 1.6,
      tags: ['rescue'],
    },
  ]

  return Object.fromEntries(items.map((e) => [e.id, e]))
}

export function investigationTasks(): InvestigationTaskTemplate[] {
  return [
    {
      id: 'task-patrick-alibi',
      title: '核验Patrick不在场证明',
      description: '调取通话、定位、消费记录并交叉验证证词。',
      durationSec: 90,
      resultEvidenceIds: ['patrick-alibi'],
    },
    {
      id: 'task-chemicals',
      title: '追查失窃化学品',
      description: '联系实验室管理员，获取出入库记录与监控片段。',
      durationSec: 120,
      resultEvidenceIds: ['chemicals-theft'],
    },
    {
      id: 'task-britt-social',
      title: '分析Britt社交媒体',
      description: '抓取近期动态，定位拍摄地点与可疑身影。',
      durationSec: 90,
      resultEvidenceIds: ['britt-social-basement'],
    },
    {
      id: 'task-neighborhood-cctv',
      title: '调取邻里监控',
      description: '拉取社区摄像头时间线，寻找潜伏/转移画面。',
      durationSec: 150,
      resultEvidenceIds: ['rob-trunk-cctv'],
      requires: {
        evidenceAnyOf: ['britt-social-basement'],
      },
    },
    {
      id: 'task-rob-home',
      title: '搜查Rob住所',
      description: '申请搜查令并快速清点可疑材料与文件。',
      durationSec: 180,
      resultEvidenceIds: ['rob-bomb-materials'],
      requires: {
        evidenceAnyOf: ['chemicals-theft', 'rob-trunk-cctv'],
        secondsRemainingLTE: 65 * 60,
      },
    },
    {
      id: 'task-rescue-britt',
      title: '营救Britt',
      description: '根据线索追踪定位并实施突入营救。',
      durationSec: 210,
      resultEvidenceIds: ['britt-rescued', 'rob-confession'],
      requires: {
        evidenceAnyOf: ['rob-bomb-materials'],
        secondsRemainingLTE: 25 * 60,
      },
    },
    {
      id: 'task-audit-logs',
      title: '审计Mercy Court日志',
      description: '检视概率变更记录，追踪异常标注/上传延迟。',
      durationSec: 140,
      resultEvidenceIds: ['jaq-tampering'],
      requires: {
        secondsRemainingLTE: 40 * 60,
      },
    },
    {
      id: 'task-system-exploit',
      title: '尝试系统漏洞（隐藏）',
      description: '以设计者权限检查输入校验与权重溢出路径。',
      durationSec: 160,
      resultEvidenceIds: ['mcc-exploit'],
      requires: {
        secondsRemainingLTE: 30 * 60,
      },
    },
  ]
}

