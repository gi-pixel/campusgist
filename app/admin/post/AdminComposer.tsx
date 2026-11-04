'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/lib/posts'
import type { Database } from '@/lib/supabase/types'

type PostCategory = Database['public']['Enums']['post_category']

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'campus', label: 'Campus' },
  { value: 'confessions', label: 'Confessions' },
  { value: 'studies', label: 'Studies' },
  { value: 'entertainment', label: 'Entertainment' },
]

export function AdminComposer() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory>('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePost() {
    if (!content.trim()) return
    setLoading(true)
    setError(null)

    try {
      await createPost({ content: content.trim(), category })
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-[#2f3336] rounded-xl p-4 bg-[#0a0a0a]">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write an official announcement..."
        rows={5}
        maxLength={280}
        className="w-full bg-transparent text-white outline-none resize-none"
      />

      {error && (
        <div className="mt-2 text-sm text-red-500">{error}</div>
      )}

      <div className="flex justify-between items-center mt-4 border-t border-[#2f3336] pt-4">
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
            className="bg-[#16181c] text-white px-3 py-1.5 rounded-lg outline-none text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <span className="text-xs text-[#71767b]">{content.length}/280</span>
        </div>
        <button
          onClick={handlePost}
          disabled={loading || !content.trim()}
          className="bg-[#1d9bf0] text-white px-5 py-2 rounded-full font-bold text-sm disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post as Admin'}
        </button>
      </div>
    </div>
  )
}