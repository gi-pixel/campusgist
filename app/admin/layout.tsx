import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { AdminTopNav, AdminBottomNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin()

  // Open reports count, shown as a badge on the Reports nav item
  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
  const reportCount = count ?? 0

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#2a2a2a] bg-[#101010]/90 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-4 lg:h-16">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-[19px] font-extrabold tracking-tight">CampusGist</span>
            <span className="rounded-full bg-[#ff3040]/15 px-2 py-0.5 text-[11px] font-semibold text-[#ff6b78]">
              Admin
            </span>
          </Link>

          <AdminTopNav reportCount={reportCount} />

          <Link
            href="/"
            className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#1e1e1e]"
          >
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 lg:pb-10 lg:pt-8">{children}</main>

      <AdminBottomNav reportCount={reportCount} />
    </div>
  )
}