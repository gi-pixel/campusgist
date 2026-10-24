'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { EMOJIS, storeEmoji } from '@/lib/avatar'
import { isOnboarded, markOnboarded } from '@/lib/onboarding'

type Stage = 'welcome' | 'rules' | 'emoji'
const STAGES: Stage[] = ['welcome', 'rules', 'emoji']

const RULES = [
  { icon: '🥷', text: 'Every post is anonymous. Identity is not tracked.' },
  { icon: '🚫', text: 'No doxxing, threats, or targeted harassment.' },
  { icon: '🗑️', text: 'Posts stay up until you delete them or an admin removes them.' },
  { icon: '🛡️', text: 'Reported content is reviewed by moderators.' },
]

export function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [stage, setStage] = useState<Stage>('welcome')
  const [selected, setSelected] = useState<string | null>(null)

  // True when the visitor arrived through a shared post link
  const fromLink = (usePathname() ?? '').startsWith('/post/')

  useEffect(() => {
    if (isOnboarded()) return
    setVisible(true)
  }, [])

  function finish(emoji?: string | null) {
    if (emoji) storeEmoji(emoji)
    markOnboarded() // saves the flag and triggers the anonymous sign-in
    setVisible(false)
  }

  if (!visible) return null

  const stageIndex = STAGES.indexOf(stage)

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
        {/* Welcome */}
        {stage === 'welcome' && (
          <div className="w-full max-w-[400px] text-center">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#1e1e1e] text-5xl shadow-lg">
              🥷
            </div>
            <h1 className="text-[32px] font-bold tracking-tight">CampusGist</h1>
            <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-relaxed text-[#9a9a9a]">
              {fromLink
                ? "Someone shared a post with you. A quick intro first, then you'll see it."
                : 'Anonymous, unfiltered campus talk. No accounts. No names.'}
            </p>
          </div>
        )}

        {/* Rules */}
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

        {/* Emoji picker */}
        {stage === 'emoji' && (
          <div className="w-full max-w-[420px] text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2a2a2a] text-5xl">
              {selected ?? '❔'}
            </div>
            <h2 className="text-[24px] font-bold tracking-tight">Pick your mask</h2>
            <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-relaxed text-[#9a9a9a]">
              This emoji shows next to your posts. Skip it and we&apos;ll pick a random one.
            </p>

            <div className="mt-7 grid grid-cols-4 gap-3">
              {EMOJIS.map((e) => {
                const active = e === selected
                return (
                  <button
                    key={e}
                    onClick={() => setSelected(e)}
                    aria-label={`Choose ${e}`}
                    aria-pressed={active}
                    className={`flex aspect-square items-center justify-center rounded-2xl border text-3xl transition ${
                      active
                        ? 'scale-105 border-white bg-[#2a2a2a]'
                        : 'border-[#2a2a2a] bg-[#181818] hover:border-[#444] hover:bg-[#1e1e1e]'
                    }`}
                  >
                    {e}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
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
              onClick={() => finish(selected)}
              disabled={!selected}
              className={`w-full rounded-2xl py-3.5 text-[15px] font-semibold transition ${
                selected
                  ? 'bg-white text-black hover:bg-[#e6e6e6]'
                  : 'bg-[#2a2a2a] text-[#6b6b6b]'
              }`}
            >
              {fromLink ? 'View post' : 'Continue'}
            </button>
            <button
              onClick={() => finish()}
              className="py-2.5 text-[14px] text-[#9a9a9a] transition-colors hover:text-white"
            >
              Skip, give me a random one
            </button>
          </div>
        )}
      </div>
    </div>
  )
}