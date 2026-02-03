import { Canvas } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ChatDrawer } from './components/ChatDrawer'
import { ConfigModal } from './components/ConfigModal'
import { CountdownPill } from './components/CountdownPill'
import { EndingOverlay } from './components/EndingOverlay'
import { EvidenceBoard } from './components/EvidenceBoard'
import { HoloScene } from './components/HoloScene'
import { InvestigationDrawer } from './components/InvestigationDrawer'
import { ProbabilityPill } from './components/ProbabilityPill'
import { useGame } from './lib/game'

export default function App() {
  const game = useGame()
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  const judgeSubtitle = useMemo(() => {
    if (game.ending?.type === 'executed') return '判决已生效'
    if (game.ending?.type === 'acquitted') return '已满足免死阈值'
    return game.isEvaluating ? '证据审查中…' : '审理进行中'
  }, [game.ending?.type, game.isEvaluating])

  return (
    <div className="app">
      <Canvas
        className="scene"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 52 }}
      >
        <HoloScene />
      </Canvas>

      <div className="ui">
        <header className="topBar">
          <div className="topBarLeft">
            <motion.div
              className="judgeCard glass"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="judgeAvatar" aria-hidden="true" />
              <div className="judgeMeta">
                <div className="judgeName">Judge Maddox</div>
                <div className="judgeSub">{judgeSubtitle}</div>
              </div>
            </motion.div>
          </div>

          <div className="topBarRight">
            <ProbabilityPill guilt={game.guilt} />
            <CountdownPill
              totalSeconds={game.totalSeconds}
              secondsRemaining={game.secondsRemaining}
            />

            <button
              type="button"
              className="btn glassBtn"
              onClick={() => setIsConfigOpen(true)}
            >
              配置
            </button>
          </div>
        </header>

        <main className="main">
          <EvidenceBoard
            evidence={game.evidence}
            selectedIds={game.selectedEvidenceIds}
            onToggleSelect={game.toggleEvidenceSelection}
            onSubmitSelected={game.submitSelectedEvidence}
            canSubmit={!game.ending && !game.isEvaluating && game.selectedEvidenceIds.size > 0}
            isEvaluating={game.isEvaluating}
            canFinalize={!game.ending && game.canFinalize}
            onFinalize={game.finalize}
          />
        </main>

        <InvestigationDrawer
          secondsRemaining={game.secondsRemaining}
          tasks={game.taskTemplates}
          runs={game.taskRuns}
          onDispatch={game.dispatchTask}
          disabled={!!game.ending}
        />

        <ChatDrawer
          messages={game.chat}
          disabled={!!game.ending || game.isChatting}
          isChatting={game.isChatting}
          onSend={game.sendChat}
          quickPrompts={game.quickPrompts}
        />

        <AnimatePresence>
          {isConfigOpen ? (
            <ConfigModal
              key="config"
              value={game.judgeConfig}
              modelState={game.modelState}
              onRefreshModels={game.refreshModels}
              onChange={game.setJudgeConfig}
              onClose={() => setIsConfigOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.ending ? (
            <EndingOverlay
              key="ending"
              ending={game.ending}
              guilt={game.guilt}
              secondsRemaining={game.secondsRemaining}
              onRestart={game.restart}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
