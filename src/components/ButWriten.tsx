import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'

export default function ChatButton({
  itemId,
  sellerId,
}: {
  itemId: string
  sellerId: string
}) {
  const navigate = useNavigate()
  const { session } = useAuth()

  const handleChat = async () => {
    if (!session) { 
      navigate('/auth')
      return
    }

    const userId = session.user.id

    const { data: existingChat, error: findError } = await supabase
      .from('chats')
      .select('id')
      .eq('item_id', itemId)
      .eq('buyer_id', userId)
      .eq('seller_id', sellerId)
      .maybeSingle()

    if (findError) {
      console.error('Ошибка поиска чата:', findError)
      return
    }

    if (existingChat) {
      navigate(`/chat/${existingChat.id}`)
      return
    }

    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        item_id: itemId,
        buyer_id: userId,
        seller_id: sellerId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Ошибка создания чата:', error)
      return
    }

    navigate(`/chat/${newChat.id}`)
  }

  return (
    <button onClick={handleChat} style={styles.button}>
      Написать продавцу
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    width: '100%',
    padding: '12px',
    background: '#5664c1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
  },
}