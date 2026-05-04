import { supabase } from './supabaseClient'

export const isFavorite = async (userId: string, itemId: string) => {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle()

  return !!data
}

export const toggleFavorite = async (userId: string, itemId: string) => {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle()

  if (data) {
    await supabase.from('favorites').delete().eq('id', data.id)
    return true
  } else {
    await supabase.from('favorites').insert({
      user_id: userId,
      item_id: itemId,
    })
    return true
  }
}