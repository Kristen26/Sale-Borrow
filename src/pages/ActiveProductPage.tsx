import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import MyItemCard from '../components/MyItemCard'
import TopBar from '../components/TopBar'
import type { Tables } from '../types/database.types'

type Item = Tables<'items'>

export default function ActiveProductPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<Item[]>([])
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
        .from('items')
        .select('*')
        .eq('owner_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (data) setItems(data)

      setLoading(false)
    }

    load()
  }, [session, navigate])

  const stopItem = async (id: string) => {
    await supabase
      .from('items')
      .update({ is_active: false })
      .eq('id', id)

    setItems(prev => prev.filter(i => i.id !== id))
  }

  if (loading) return <div style={{ padding: 16, textAlign: 'left' }}>Загрузка...</div>

  return (
    <div style={layout.page}>
      <div 
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >
        <TopBar title="Активные объявления" />

        <div 
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          {items.length === 0 && (
            <div style={styles.empty}>Нет активных объявлений</div>
          )}

          {items.map(item => (
            <MyItemCard
              key={item.id}
              item={item}
              onEdit={() => navigate(`/edit/${item.id}`)}
              onAction={() => stopItem(item.id)}
              actionText="Завершить"
              actionStyle={styles.stop}
            />
          ))}
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

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '110px 16px 80px',
    textAlign: 'left',
  },
  empty: {
    color: '#888',
    fontSize: '15px',
    textAlign: 'center',
    padding: '40px 0',
    width: '100%',
  },
  stop: {
    background: '#99be9b',
    color: '#fff',
    borderColor: '#ffffff',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  containerMobile: {
    padding: '90px 12px 80px',
  },
}
