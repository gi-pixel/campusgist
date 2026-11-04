import { requireAdmin } from '@/lib/admin'
import Link from 'next/link'

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin()

  // Fetch stats
  const { count: totalPosts } = await supabase.from('posts').select('*', { count: 'exact', head: true })
  const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open')
  
  // Fetch recent posts for quick moderation
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 border border-[#2f3336] rounded-xl bg-[#0a0a0a]">
          <h3 className="text-[#71767b] text-sm mb-1">Total Posts (Active)</h3>
          <p className="text-3xl font-bold">{totalPosts || 0}</p>
        </div>
        <div className="p-6 border border-[#2f3336] rounded-xl bg-[#0a0a0a]">
          <h3 className="text-[#71767b] text-sm mb-1">Pending Reports</h3>
          <p className="text-3xl font-bold text-red-500">{totalReports || 0}</p>
        </div>
      </div>

      {/* Recent Posts Table */}
      <h3 className="text-xl font-bold mb-4">Recent Posts</h3>
      <div className="border border-[#2f3336] rounded-xl overflow-hidden bg-[#0a0a0a]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#16181c] text-[#71767b]">
            <tr>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2f3336]">
            {recentPosts?.map((post) => (
              <tr key={post.id} className="hover:bg-[#16181c]/50">
                <td className="px-4 py-3 max-w-md truncate">{post.content}</td>
                <td className="px-4 py-3 text-[#71767b]">{post.category}</td>
                <td className="px-4 py-3 text-[#71767b]">
                  {new Date(post.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${post.id}`} className="text-[#1d9bf0] hover:underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}