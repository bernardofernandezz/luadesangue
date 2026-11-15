import { useState } from 'react'
import { ROLE_LIST, type RoleId } from '../../engine/roles'
import { Icon } from '../kit/icons'
import { Sheet } from '../kit/layout'
import { RoleBadge, RoleDetails } from './RoleViews'

export function RoleGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [role, setRole] = useState<RoleId | null>(null)
  const close = () => { setRole(null); onClose() }
  return (
    <Sheet open={open} onClose={close} title="Guia de papéis">
      {role ? (
        <>
          <button onClick={() => setRole(null)} className="mb-4 flex items-center gap-1 text-sm text-muted"><Icon name="back" size={16} />Todos os papéis</button>
          <RoleDetails role={role} />
        </>
      ) : (
        <ul className="space-y-2">
          {ROLE_LIST.map((r) => (
            <li key={r.id}>
              <button onClick={() => setRole(r.id)} className="card flex w-full items-center gap-3 rounded-2xl p-3 text-left">
                <RoleBadge role={r.id} size={40} />
                <span className="flex-1"><span className="block font-medium">{r.name}</span><span className="block text-sm text-muted">{r.tagline}</span></span>
                <Icon name="back" size={16} className="rotate-180 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}
