import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminPostList } from '@/components/admin/AdminPostList'

const PAGE = 20
const CATEGORIES = ['all', 'general', 'campus', 'confessions', 'studies', 'entertainment']

function href(params: { category?: string; q?: string; before?: string | null }) {
  const sp = new URLSearchParams()
  if (params.category && params.category !== 'all') sp.set('category', params.category)
  if (params.q) sp.set('q', params.q)
  if (params.before) sp.set('before', params.before)
  const qs = sp.toString()
  return qs ? `/admin/posts?${qs}` : '/admin/posts'
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; before?: string }>
}) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const category = CATEGORIES.includes(sp.category ?? '') ? sp.category! : 'all'
  const before = sp.before

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE + 1) // one extra row tells us whether there is another page

  if (category !== 'all') query = query.eq('category', category as any)
  if (q) query = query.ilike('content', `%${q.replace(/[\\%_]/g, '\\$&')}%`)
  if (before) query = query.lt('created_at', before)

  const { data } = await query
  const rows = data ?? []
  const posts = rows.slice(0, PAGE)
  const nextBefore = rows.length > PAGE ? posts[posts.length - 1].created_at : null

  return (
    <div>
      <PageHeader title="Posts" description="Search, filter and remove any post." />

      {/* Search */}
      <form method="get" className="flex gap-2">
        {category !== 'all' && <input type="hidden" name="category" value={category} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search posts"
          className="min-w-0 flex-1 rounded-full bg-[#222] px-4 py-2.5 text-[16px] text-white outline-none placeholder:text-[#6b6b6b]"
        />
        <button
          type="submit"
          className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition hover:bg-[#e6e6e6]"
        >
          Search
        </button>
      </form>

      {/* Category pills */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={href({ category: c, q })}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              c === category
                ? 'border-white bg-white text-black'
                : 'border-[#2a2a2a] text-[#9a9a9a] hover:border-[#444] hover:text-white'
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        {/* key resets the list's state whenever the filters or page change */}
        <AdminPostList
          key={`${category}|${q}|${before ?? ''}`}
          initialPosts={posts}
          emptyText={q || category !== 'all' ? 'No posts match that.' : 'No posts yet.'}
        />
      </div>

      {nextBefore && (
        <div className="mt-6 text-center">
          <Link
            href={href({ category, q, before: nextBefore })}
            className="rounded-full border border-[#2a2a2a] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#222]"
          >
            Older posts
          </Link>
        </div>
      )}
    </div>
  )
}