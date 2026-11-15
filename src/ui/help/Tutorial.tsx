import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Btn } from '../kit/controls'
import { Dots } from '../kit/layout'
import { Icon } from '../kit/icons'
import { RoleIcon } from '../roles/RoleIcon'
import { canPrompt, install, installed, isIos } from './install'

type Slide = { icon?: ReactNode; logo?: boolean; title: string; text: string; install?: boolean }

const baseSlides: Slide[] = [
  { logo: true, title: 'Um celular, todos jogam', text: 'Sentem-se em roda. O app chama cada um pelo nome. Quando for a sua vez, pegue o celular e segure o círculo para ver sua tela, sem ninguém olhar.' },
  { icon: <Icon name="moon" size={44} />, title: 'À noite, em segredo', text: 'Todo mundo joga à noite, até quem não tem poder, para ninguém deduzir nada. Os lobos escolhem uma vítima; os outros usam suas habilidades.' },
  { icon: <Icon name="sun" size={44} />, title: 'De dia, em voz alta', text: 'O app anuncia quem morreu. Vocês discutem, acusam e votam em quem será linchado. Mentir é permitido, e esperado.' },
  { icon: <span className="flex gap-3"><RoleIcon role="aldeao" size={36} /><RoleIcon role="lobisomem" size={36} /></span>, title: 'Como se vence', text: 'A Vila vence ao eliminar todos os lobos. Os Lobos vencem quando forem metade dos vivos. Alguns papéis jogam sozinhos e têm objetivos próprios.' },
]

const installSlide: Slide = {
  icon: <Icon name="download" size={44} />, title: 'Baixe o app', install: true,
  text: 'Instale na tela inicial: abre em tela cheia, sem a barra do navegador, e funciona até sem internet.',
}

function InstallAction({ onDone }: { onDone: () => void }) {
  const [prompt] = useState(canPrompt)
  if (prompt) return <Btn kind="ghost" icon="download" className="mx-auto mt-8 px-6" onClick={() => install().then((ok) => ok && onDone())}>Baixar app</Btn>
  const steps = isIos()
    ? ['Toque em Compartilhar (o quadrado com a seta) na barra do Safari.', 'Escolha “Adicionar à Tela de Início”.', 'Toque em Adicionar.']
    : ['Abra o menu do navegador (⋮).', 'Toque em “Instalar app” ou “Adicionar à tela inicial”.']
  return (
    <ol className="mx-auto mt-6 max-w-80 space-y-2 text-left text-[15px] text-muted">
      {steps.map((t, k) => (
        <li key={k} className="card flex gap-3 rounded-2xl p-3"><span className="font-semibold text-moon tabular-nums">{k + 1}</span>{t}</li>
      ))}
    </ol>
  )
}

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [slides] = useState(() => (installed() ? baseSlides : [...baseSlides, installSlide]))
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const go = (n: number) => { if (n < 0 || n >= slides.length) return; setDir(n > i ? 1 : -1); setI(n) }
  const last = i === slides.length - 1
  const s = slides[i]
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1.5rem,calc(env(safe-area-inset-top)+.5rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-end"><Btn kind="quiet" className="min-h-10" onClick={onDone}>Pular</Btn></div>
        <div className="relative flex flex-1 items-center overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={i} custom={dir} className="w-full text-center"
              initial={{ x: dir * 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir * -60, opacity: 0 }} transition={{ duration: 0.3 }}
              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3}
              onDragEnd={(_, info) => { if (info.offset.x < -60) go(i + 1); else if (info.offset.x > 60) go(i - 1) }}>
              {s.logo
                ? <img src="/icon-512.png" alt="Lua de Sangue" draggable={false} className="mx-auto size-32 rounded-[30px] shadow-[0_10px_50px_rgb(240_40_60/.25)]" />
                : <div className="mx-auto grid size-28 place-items-center rounded-full border border-line bg-white/[.03] text-moon">{s.icon}</div>}
              <h2 className="mt-10 font-display text-4xl text-gradient leading-tight">{s.title}</h2>
              <p className="mx-auto mt-4 max-w-80 text-[17px] leading-relaxed text-muted">{s.text}</p>
              {s.install && <InstallAction onDone={onDone} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <Dots step={i} total={slides.length} />
        <Btn className="mt-6" onClick={() => (last ? onDone() : go(i + 1))}>{last ? 'Vamos jogar' : 'Próximo'}</Btn>
      </div>
    </motion.div>
  )
}
