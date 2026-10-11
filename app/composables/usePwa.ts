import { computed, shallowRef, ref } from 'vue'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: string }>
}

const deferred = shallowRef<InstallPromptEvent | null>(null)
const installed = ref(false)

if (typeof window !== 'undefined') {
  installed.value = window.matchMedia('(display-mode: standalone)').matches
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred.value = e as InstallPromptEvent
  })
  window.addEventListener('appinstalled', () => { installed.value = true; deferred.value = null })
}

async function install(): Promise<void> {
  const e = deferred.value
  if (!e) return
  await e.prompt()
  await e.userChoice
  deferred.value = null
}

export function usePwa() {
  return { canInstall: computed(() => !!deferred.value && !installed.value), installed, install }
}
