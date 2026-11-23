'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { EMOJIS, storeEmoji } from '@/lib/avatar'
import { isOnboarded, markOnboarded } from '@/lib/onboarding'
import { nicknameAvailable, setNickname, needsNickname } from '@/lib/nickname'
type Stage = 'welcome' | 'rules' | 'emoji' | 'nickname'
const STAGES: Stage[] = ['welcome', 'rules', 'emoji', 'nickname']

const RULES = [
  { icon: '🥷', text: 'Your real identity is never shown — only your nickname and emoji.' },
  { icon: '🚫', text: 'No doxxing, threats, or targeted harassment.' },
  { icon: '🗑️', text: 'Posts stay up until you delete them or an admin removes them.' },
  { icon: '🛡️', text: 'Reported content is reviewed by moderators.' },
]

const NICKNAME_RE = /^[A-Za-z][A-Za-z0-9_]{1,19}$/

// Extract the first grapheme cluster from whatever the user typed/pasted.
// Uses Intl.Segmenter (Chrome 87+, Safari 14.1+, Firefox 125+), which is
// available in every browser this app already targets.
function firstGrapheme(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const seg = new (Intl as any).Segmenter('en', { granularity: 'grapheme' })
  const first = [...seg.segment(trimmed)][0]?.segment ?? ''
  return first || null
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [stage, setStage] = useState<Stage>('welcome')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [emojiInput, setEmojiInput] = useState('')
  const [nickname, setNicknameValue] = useState('')

  const pathname = usePathname() ?? ''
  const fromLink = pathname.startsWith('/post/')
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/login')

useEffect(() => {
  if (isAdminArea) return
  if (isOnboarded()) {
    // LocalStorage says done, but verify the DB has a nickname
    needsNickname()
      .then((needs) => {
        if (needs) {
          setStage('nickname') // skip welcome/rules/emoji, go straight to nickname
          setVisible(true)
        }
      })
      .catch(() => {
        // DB check failed — fall back to localStorage decision
      })
    return
  }
  setVisible(true)
}, [isAdminArea])

  if (!visible || isAdminArea) return null

  const stageIndex = STAGES.indexOf(stage)

  // Persist emoji to localStorage as soon as the user leaves the emoji step.
  function advanceFromEmoji() {
    if (!emoji) return
    storeEmoji(emoji)
    setStage('nickname')
  }

  async function finish() {
    // Save nickname server-side. Errors are surfaced by NicknameStep already,
    // but the throw here is a last-resort guard.
    const trimmed = nickname.trim()
    if (!NICKNAME_RE.test(trimmed)) return
    await setNickname(trimmed)
    markOnboarded()
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#101010] text-white">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stageIndex ? 'w-6 bg-white' : 'w-1.5 bg-[#3a3a3a]'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
        {stage === 'welcome' && (
          <div className="w-full max-w-[400px] text-center">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#1e1e1e] text-5xl shadow-lg">
              🥷
            </div>
            <h1 className="text-[32px] font-bold tracking-tight">CampusGist</h1>
            <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-relaxed text-[#9a9a9a]">
              {fromLink
                ? "Someone shared a post with you. A quick intro first, then you'll see it."
                : 'Pseudonymous campus talk. Pick a nickname and emoji — no real names.'}
            </p>
          </div>
        )}

        {stage === 'rules' && (
          <div className="w-full max-w-[460px]">
            <h2 className="text-center text-[24px] font-bold tracking-tight">House rules</h2>
            <p className="mt-2 text-center text-[14px] text-[#9a9a9a]">
              Keep it fun, keep it safe.
            </p>

            <ul className="mt-6 overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#181818]">
              {RULES.map((rule) => (
                <li
                  key={rule.text}
                  className="flex items-center gap-4 border-b border-[#2a2a2a] px-5 py-4 last:border-0"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-lg">
                    {rule.icon}
                  </span>
                  <span className="text-[14px] leading-snug text-[#e6e6e6]">{rule.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === 'emoji' && (
          <div className="w-full max-w-[420px] text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2a2a2a] text-5xl">
              {emoji ?? '❔'}
            </div>
            <h2 className="text-[24px] font-bold tracking-tight">Pick your mask</h2>
            <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-relaxed text-[#9a9a9a]">
              Use your keyboard&apos;s emoji picker, or tap a suggestion below.
            </p>

            <input
              value={emojiInput}
              onChange={(e) => {
                const next = e.target.value
                setEmojiInput(next)
                const first = firstGrapheme(next)
                if (first) setEmoji(first)
              }}
              placeholder="Tap here and open your emoji keyboard"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              className="mt-6 w-full rounded-2xl border border-[#2a2a2a] bg-[#181818] px-4 py-3 text-center text-[28px] text-white outline-none placeholder:text-[12px] placeholder:text-[#6b6b6b] focus:border-[#444]"
            />

            <div className="mt-4 grid grid-cols-6 gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setEmoji(e)
                    setEmojiInput(e)
                  }}
                  aria-label={`Choose ${e}`}
                  aria-pressed={e === emoji}
                  className={`flex aspect-square items-center justify-center rounded-xl border text-2xl transition ${
                    e === emoji
                      ? 'border-white bg-[#2a2a2a]'
                      : 'border-[#2a2a2a] bg-[#181818] hover:border-[#444] hover:bg-[#1e1e1e]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'nickname' && (
          <NicknameStep value={nickname} onChange={setNicknameValue} />
        )}
      </div>

      <div className="mx-auto w-full max-w-[460px] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {stage === 'welcome' && (
          <button
            onClick={() => setStage('rules')}
            className="w-full rounded-2xl bg-white py-3.5 text-[15px] font-semibold text-black transition hover:bg-[#e6e6e6]"
          >
            Continue
          </button>
        )}

        {stage === 'rules' && (
          <button
            onClick={() => setStage('emoji')}
            className="w-full rounded-2xl bg-white py-3.5 text-[15px] font-semibold text-black transition hover:bg-[#e6e6e6]"
          >
            I agree
          </button>
        )}

        {stage === 'emoji' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={advanceFromEmoji}
              disabled={!emoji}
              className={`w-full rounded-2xl py-3.5 text-[15px] font-semibold transition ${
                emoji ? 'bg-white text-black hover:bg-[#e6e6e6]' : 'bg-[#2a2a2a] text-[#6b6b6b]'
              }`}
            >
              Continue
            </button>
            <button
              onClick={() => {
                // Skip: pick a random one from the preset list
                const random = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
                setEmoji(random)
                setEmojiInput(random)
                storeEmoji(random)
                setStage('nickname')
              }}
              className="py-2.5 text-[14px] text-[#9a9a9a] transition-colors hover:text-white"
            >
              Skip, give me a random one
            </button>
          </div>
        )}

        {stage === 'nickname' && (
          <NicknameFinish
            nickname={nickname}
            fromLink={fromLink}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  )
}

function NicknameStep({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
  const debounced = useDebounced(value, 350)

  useEffect(() => {
    let cancelled = false
    const trimmed = debounced.trim()

    if (!trimmed) {
      setStatus('idle')
      return
    }
    if (!NICKNAME_RE.test(trimmed)) {
      setStatus('invalid')
      return
    }

    setStatus('checking')
    nicknameAvailable(trimmed)
      .then((free) => {
        if (!cancelled) setStatus(free ? 'ok' : 'taken')
      })
      .catch(() => {
        if (!cancelled) setStatus('idle')
      })

    return () => {
      cancelled = true
    }
  }, [debounced])

  const borderColor =
    status === 'ok'
      ? 'border-green-600'
      : status === 'taken' || status === 'invalid'
        ? 'border-[#ff4d6d]'
        : 'border-[#2a2a2a]'

  return (
    <div className="w-full max-w-[420px] text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2a2a2a] text-5xl">
        {value ? '🏷️' : '❔'}
      </div>
      <h2 className="text-[24px] font-bold tracking-tight">Pick a nickname</h2>
      <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-relaxed text-[#9a9a9a]">
        This is how others will see you. 2–20 characters, letters/numbers/underscores.
      </p>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. NightOwl"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={20}
        className={`mt-6 w-full rounded-2xl border bg-[#181818] px-4 py-3 text-center text-[16px] text-white outline-none placeholder:text-[#6b6b6b] ${borderColor}`}
      />

      <p className="mt-2 text-[13px]">
        {status === 'checking' && <span className="text-[#6b6b6b]">Checking…</span>}
        {status === 'ok' && <span className="text-green-500">Available</span>}
        {status === 'taken' && <span className="text-[#ff4d6d]">Already taken</span>}
        {status === 'invalid' && (
          <span className="text-[#ff4d6d]">
            2–20 chars, start with a letter, only letters/numbers/underscores
          </span>
        )}
      </p>
    </div>
  )
}

function NicknameFinish({
  nickname,
  fromLink,
  onFinish,
}: {
  nickname: string
  fromLink: boolean
  onFinish: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = NICKNAME_RE.test(nickname.trim())

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await onFinish()
    } catch (err: any) {
      setError(err?.message ?? 'Could not save nickname')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-center text-[13px] text-[#ff4d6d]">{error}</p>}
      <button
        onClick={submit}
        disabled={!valid || busy}
        className={`w-full rounded-2xl py-3.5 text-[15px] font-semibold transition ${
          valid && !busy ? 'bg-white text-black hover:bg-[#e6e6e6]' : 'bg-[#2a2a2a] text-[#6b6b6b]'
        }`}
      >
        {busy ? 'Saving…' : fromLink ? 'View post' : 'Continue'}
      </button>
    </div>
  )
}