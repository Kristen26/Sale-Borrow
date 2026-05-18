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
  seller: { first_name: string; avatar_url: string | null } | null
  last_message: Message[]
}

export default function ChatsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
          seller:profiles!chats_seller_id_fkey(first_name, avatar_url),
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
      <div 
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >

        <TopBar title="Чаты" />

        <div 
          style={{
            ...styles.content,
            ...(isMobile && mobileStyles.contentMobile)
          }}
        >
          {loading && <div style={{ textAlign: 'left' }}>Загрузка...</div>}

          {!loading && chats.length === 0 && (
            <div style={{ color: '#777', textAlign: 'left' }}>Нет чатов</div>
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
                  {chat.seller?.avatar_url ? (
                    <img 
                      src={chat.seller.avatar_url} 
                      alt="" 
                      style={styles.avatarImg} 
                    />
                  ) : (
                    chat.item?.title?.[0] || '💬'
                  )}
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
    textAlign: 'left',
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
    textAlign: 'left',
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
    flexShrink: 0,
    overflow: 'hidden',
    border: '1px solid #eee',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '4px',
    gap: '8px',
    width: '100%',
  },

  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    alignItems: 'flex-start',
    textAlign: 'left',
  },

  name: {
    fontWeight: 600,
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'left',
    flex: 1,
  },

  time: {
    fontSize: '12px',
    color: '#999',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textAlign: 'right',
  },

  message: {
    fontSize: '13px',
    color: '#666',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'left',
    width: '100%',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  contentMobile: {
    padding: '80px 12px 12px',
  },
}
