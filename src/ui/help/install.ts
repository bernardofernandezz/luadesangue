// Chrome/Android fires beforeinstallprompt once, early; keep it so the tutorial can trigger the install later.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let deferred: InstallEvent | null = null
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent })
window.addEventListener('appinstalled', () => { deferred = null })

export const installed = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
export const isIos = () => document.documentElement.classList.contains('ios')
export const canPrompt = () => !!deferred

/** Shows the native install dialog (Android/desktop Chrome). Resolves true if the user accepted. */
export async function install() {
  if (!deferred) return false
  const e = deferred
  deferred = null // the event can only be used once
  await e.prompt()
  return (await e.userChoice).outcome === 'accepted'
}
