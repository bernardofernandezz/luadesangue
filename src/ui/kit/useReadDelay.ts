import { useEffect, useState } from 'react'

/** True after `ms`: keeps "continue" disabled until there was time to read. */
export function useReadDelay(ms: number) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), ms); return () => clearTimeout(t) }, [ms])
  return ready
}
