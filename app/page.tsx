import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content, category, created_at')
    .limit(1)

  return (
    <pre style={{ padding: 20, color: '#fff', background: '#000' }}>
      {JSON.stringify({ posts, error: error?.message }, null, 2)}
    </pre>
  )
}