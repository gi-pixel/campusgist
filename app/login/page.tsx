'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      setError(error?.message ?? 'Sign in failed')
      setLoading(false)
      return
    }

    // Verify the admin claim in the token
    let role: string | undefined
    try {
      const payload = data.session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      role = JSON.parse(atob(payload)).user_role
    } catch {
      await supabase.auth.signOut()
      setError('Could not verify admin access. Try again.')
      setLoading(false)
      return
    }

    if (role !== 'admin') {
      await supabase.auth.signOut()
      setError(
        'Signed in, but this account has no admin role. Check its row in user_roles and that the Custom Access Token hook is enabled.'
      )
      setLoading(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101010] p-4 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-3 rounded-3xl border border-[#2a2a2a] bg-[#181818] p-6"
      >
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="text-[20px] font-extrabold tracking-tight">CampusGist</span>
          <span className="rounded-full bg-[#ff3040]/15 px-2 py-0.5 text-[11px] font-semibold text-[#ff6b78]">
            Admin
          </span>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full rounded-xl bg-[#222] px-4 py-3 text-[16px] text-white outline-none placeholder:text-[#6b6b6b]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl bg-[#222] px-4 py-3 text-[16px] text-white outline-none placeholder:text-[#6b6b6b]"
        />

        {error && <p className="text-[13px] leading-snug text-[#ff4d6d]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-xl bg-white py-3 text-[15px] font-semibold text-black transition hover:bg-[#e6e6e6] disabled:bg-[#2e2e2e] disabled:text-[#777]"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}