const KEY = 'campusgist_onboarded'
export const ONBOARDED_EVENT = 'campusgist:onboarded'

// Fallback for browsers where localStorage is blocked (private modes)
let doneThisSession = false

export function isOnboarded(): boolean {
  if (doneThisSession) return true
  try {
    return !!localStorage.getItem(KEY)
  } catch {
    return false
  }
}

export function markOnboarded() {
  doneThisSession = true
  try {
    localStorage.setItem(KEY, 'true')
  } catch {}
  window.dispatchEvent(new Event(ONBOARDED_EVENT))
}