import { requireAdmin } from '@/lib/admin'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will automatically kick out non-admins
  await requireAdmin()

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-[#2f3336] p-6 flex flex-col gap-6 sticky top-0 h-screen">
        <div>
          <h1 className="text-xl font-bold text-red-500">Admin Control</h1>
          <p className="text-xs text-[#71767b] mt-1">CampusGist Management</p>
        </div>
        
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="px-4 py-2 hover:bg-[#16181c] rounded-lg transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/post" className="px-4 py-2 hover:bg-[#16181c] rounded-lg transition-colors">
            Post
          </Link>
          <Link href="/admin/reports" className="px-4 py-2 hover:bg-[#16181c] rounded-lg transition-colors">
            Reports
          </Link>
          <Link href="/" className="px-4 py-2 text-[#1d9bf0] hover:bg-[#16181c] rounded-lg transition-colors mt-auto">
            ← Back to App
          </Link>
        </nav>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}