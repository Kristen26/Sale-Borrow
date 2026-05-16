import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'

type Message = {
  content: string | null
  created_at: string
}

type Chat = {
  id: string
  item: { title: string } | null
  buyer: { first_name: string } | null
  seller: { first_name: string } | null
  last_message: Message[]
}

export default function ChatsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      navigate('/auth')
      return
    }

    const load = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('chats')
        .select(`
          id,
          item:items(title),
          buyer:profiles!chats_buyer_id_fkey(first_name),
          seller:profiles!chats_seller_id_fkey(first_name),
          last_message:messages(content, created_at)
        `)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)

      if (data) {
        setChats(data as Chat[])
      }

      setLoading(false)
    }

    load()
  }, [session, navigate])

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={layout.page}>
      <div style={layout.centered}>

        <TopBar title="Чаты" />

        <div style={styles.content}>
          {loading && <div>Загрузка...</div>}

          {!loading && chats.length === 0 && (
            <div style={{ color: '#777' }}>Нет чатов</div>
          )}

          {chats.map(chat => {
            const lastMsg = chat.last_message?.slice(-1)[0]

            return (
              <div
                key={chat.id}
                style={styles.chat}
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                <div style={styles.avatar}>
                  {chat.item?.title?.[0] || '💬'}
                </div>

                <div style={styles.info}>
                  <div style={styles.topRow}>
                  <div style={styles.name}>
                    {chat.item?.title || 'Товар'} • {chat.seller?.first_name || 'Продавец'}
                  </div>

                    {lastMsg && (
                      <div style={styles.time}>
                        {formatTime(lastMsg.created_at)}
                      </div>
                    )}
                  </div>

                  <div style={styles.message}>
                    {lastMsg?.content || 'Нет сообщений'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

const layout = {
  page: {
    background: '#eee',
    minHeight: '100vh',
  },

  centered: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: '#F8F9FA',
    minHeight: '100vh',
  }
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    padding: '90px 16px 16px',
  },

  chat: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    background: '#fff',
    borderRadius: '12px',
    marginBottom: '10px',
    cursor: 'pointer',
    alignItems: 'center',
  },

  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#5664c1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '18px',
  },

  topRow: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
},

  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  name: {
    fontWeight: 600,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  time: {
    fontSize: '12px',
    color: '#999',
  },

  message: {
    fontSize: '13px',
    color: '#666',
  },
}