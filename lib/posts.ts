import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type PostCategory = Database['public']['Enums']['post_category']

export async function uploadPostImage(file: File): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

export async function createPost(params: {
  content: string
  category: PostCategory
  imageFiles?: File[]
}): Promise<{ id: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let imageUrls: string[] = []
  if (params.imageFiles && params.imageFiles.length > 0) {
    imageUrls = await Promise.all(params.imageFiles.map(uploadPostImage))
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: params.content,
      category: params.category,
      images: imageUrls, // saving the array
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}