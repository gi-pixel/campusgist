export const EMOJIS = ['🥷', '🦊', '🐙', '🦉', '🐸', '🐺', '🦁', '🐨', '🦄', '🐼', '🐯', '🦅']

const EMOJI_STORAGE_KEY = 'campusgist_emoji'

export function getStoredEmoji(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(EMOJI_STORAGE_KEY)
}

export function storeEmoji(emoji: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(EMOJI_STORAGE_KEY, emoji)
}

export function getRandomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
}

export function resolveEmoji(): string {
  const stored = getStoredEmoji()
  if (stored) return stored
  const random = getRandomEmoji()
  storeEmoji(random)
  return random
}