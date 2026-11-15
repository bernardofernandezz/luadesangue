import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MIN_PLAYERS, lineupProblems, preset, rolesFor, type Settings } from '../../engine/setup'
import { Btn, IconBtn, Segmented } from '../kit/controls'
import { corner } from '../kit/styles'
import { Icon } from '../kit/icons'
import { Screen } from '../kit/layout'
import type { SetupData } from './data'
import { PlayersStep } from './PlayersStep'
import { Balance, RolesStep } from './RolesStep'
import { RulesStep } from './RulesStep'

const STEPS = ['Jogadores', 'Papéis', 'Regras'] as const

export function Setup({ data, onChange, onStart, onHelp, onGuide }: {
  data: SetupData; onChange: (d: SetupData) => void; onStart: () => void; onHelp: () => void; onGuide: () => void
}) {
  const [step, setStep] = useState(0)
  const n = data.names.length
  const enough = n >= MIN_PLAYERS
  const roles = rolesFor(data)
  const problems = lineupProblems(data)
  const set = (patch: Partial<SetupData>) => onChange({ ...data, ...patch })
  const setS = (patch: Partial<Settings>) => set({ settings: { ...data.settings, ...patch } })
  const next = () => { if (step === 0 && !data.pool.length) set({ pool: preset(n) }); setStep(step + 1) }

  return (
    <Screen
      lead={<div className="flex items-center gap-2.5"><img src="/icon-192.png" alt="" className="size-9 rounded-[10px]" /><p className="font-display text-3xl leading-tight italic text-gradient">Lua de Sangue</p></div>}
      footer={
        <>
          {step === 1 && <Balance roles={roles} n={n} />}
          {step > 0 && problems[0] && <p className="text-center text-sm text-solo">{problems[0]}</p>}
          <div className="flex gap-2">
            {step > 0 && <Btn kind="ghost" className="px-4" onClick={() => setStep(step - 1)}><Icon name="back" size={20} /><span className="sr-only">Voltar</span></Btn>}
            {step < STEPS.length - 1
              ? <Btn className="flex-1" disabled={!enough} onClick={next}>{step === 0 && !enough ? `Adicione mais ${MIN_PLAYERS - n}` : 'Próximo'}</Btn>
              : <Btn className="flex-1" icon="moon" disabled={problems.length > 0} onClick={onStart}>Começar a partida</Btn>}
          </div>
        </>
      }>
      <IconBtn name="help" label="Como jogar" onClick={onHelp} className={corner.left} />
      <IconBtn name="book" label="Guia de papéis" onClick={onGuide} className={corner.right} />
      <div className="mb-7">
        <Segmented id="step" label="Etapas" solid value={String(step)} onChange={(v) => setStep(Number(v))}
          options={STEPS.map((label, i) => ({ value: String(i), label, disabled: i > 0 && !enough }))} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          {step === 0 && <PlayersStep data={data} set={set} />}
          {step === 1 && <RolesStep data={data} set={set} setS={setS} />}
          {step === 2 && <RulesStep settings={data.settings} setS={setS} n={n} roles={roles} />}
        </motion.div>
      </AnimatePresence>
    </Screen>
  )
}
