import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Btn } from '../kit/controls'
import { Icon } from '../kit/icons'

/** Shows when a new version is deployed; updating swaps the service worker, drops old caches and reloads. */
export function UpdatePrompt() {
  const [busy, setBusy] = useState(false)
  const { needRefresh: [show, setShow], updateServiceWorker } = useRegisterSW({
    // Phones keep the app open for hours: look for a new version whenever it comes back to the foreground.
    onRegisteredSW(_, r) {
      if (r) document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') r.update() })
    },
  })
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[60] flex flex-col bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1.5rem,calc(env(safe-area-inset-top)+.5rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-1 flex-col justify-center text-center">
              <div className="mx-auto grid size-28 place-items-center rounded-full border border-line bg-white/[.03] text-moon"><Icon name="download" size={44} /></div>
              <h2 className="mt-10 font-display text-4xl text-gradient leading-tight">Nova versão</h2>
              <p className="mx-auto mt-4 max-w-80 text-[17px] leading-relaxed text-muted">Saiu uma atualização com novidades nos papéis e nas regras. Atualize para jogar com a versão mais recente. A partida em andamento e o placar continuam salvos.</p>
            </div>
            <Btn disabled={busy} onClick={() => { setBusy(true); updateServiceWorker() }}>{busy ? 'Atualizando…' : 'Atualizar agora'}</Btn>
            <Btn kind="quiet" className="mt-2" onClick={() => setShow(false)}>Agora não</Btn>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
