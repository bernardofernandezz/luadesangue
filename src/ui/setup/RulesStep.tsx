import { isWolf, type RoleId } from '../../engine/roles'
import type { Settings } from '../../engine/setup'
import { Choice, Switch } from '../kit/controls'
import { clock } from '../kit/format'
import { Icon } from '../kit/icons'

export function RulesStep({ settings, setS, n, roles }: { settings: Settings; setS: (p: Partial<Settings>) => void; n: number; roles: RoleId[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight">Regras da partida</h2>
      <p className="-mt-1 pb-2 text-sm text-muted">Dá para deixar como está. Tudo pode mudar na próxima partida.</p>
      <Choice title="Modo" value={settings.mode} set={(mode) => setS({ mode })} options={[
        ['narrador', 'Narrador automático', 'O app conduz noite, dia e votação.'],
        ['cartas', 'Só distribuir papéis', 'Cada um vê sua carta; um narrador humano conduz.'],
      ]} />
      {settings.mode === 'narrador' && <>
      <Switch label="Revelar papel ao morrer" hint="Quem morre mostra quem era. Desligado é mais difícil." checked={settings.revealOnDeath} onChange={(v) => setS({ revealOnDeath: v })} />
      <Switch label="Narração por voz" hint="O celular lê os anúncios em voz alta." checked={settings.narration} onChange={(v) => setS({ narration: v })} />
      <Choice title="Votação" value={settings.voteMode} set={(voteMode) => setS({ voteMode })} options={[
        ['secreta', 'Secreta', 'Cada um vota no celular, escondido.'],
        ['aberta', 'Aberta', 'Mão levantada; o anfitrião marca.'],
      ]} />
      <Choice title="Empate na votação" value={settings.tie} set={(tie) => setS({ tie })} options={[
        ['ninguem', 'Ninguém morre', 'Empatou, ninguém é linchado.'],
        ['sorteio', 'Sorteio', 'Um dos empatados é sorteado.'],
      ]} />
      <div className="rounded-3xl card p-4">
        <div className="flex justify-between"><span className="font-medium">Tempo de discussão</span><span className="text-moon tabular-nums">{clock(settings.discussionSeconds)}</span></div>
        <input type="range" min={30} max={600} step={30} value={settings.discussionSeconds} aria-label="Tempo de discussão"
          onChange={(e) => setS({ discussionSeconds: Number(e.target.value) })} className="mt-4 w-full" />
      </div>
      </>}
      <div className="flex items-center gap-3 rounded-3xl border border-line bg-white/[.03] p-4 text-sm">
        <Icon name="users" size={20} className="shrink-0 text-moon" />
        <p>{n} jogadores · {roles.length > n ? `${n} de ${roles.length} papéis sorteados` : `${roles.filter(isWolf).length} lobo(s)`} · {settings.randomRoles ? 'papéis sorteados' : 'papéis escolhidos'}{settings.mode === 'cartas' && ' · só distribuição'}</p>
      </div>
    </section>
  )
}
