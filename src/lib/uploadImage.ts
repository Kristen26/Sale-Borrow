import { supabase } from './supabaseClient'

export async function uploadImage(file: File, userId: string, itemId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${itemId}/${Date.now()}.${fileExt}`
  const filePath = `items/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('item-images')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Ошибка загрузки:', uploadError)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function uploadMultipleImages(files: File[], userId: string, itemId: string): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file, userId, itemId))
  const urls = await Promise.all(uploadPromises)
  return urls.filter((url): url is string => url !== null)
}