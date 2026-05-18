import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import ItemCard from '../components/ItemCard'
import TopBar from '../components/TopBar'
import { Heart } from 'lucide-react'
import type { Tables } from '../types/database.types'

type Item = Tables<'items'>

type FavoriteWithItem = {
  id: string
  item: Item
}

export default function FavoritesPage() {
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

    const loadFavorites = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('favorites')
        .select(`
          id,
          item:items(*)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (data) {
        const mapped = (data as FavoriteWithItem[])
          .map(f => f.item)
          .filter(Boolean)

        setItems(mapped)
      }

      setLoading(false)
    }

    loadFavorites()
  }, [session, navigate])

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Загрузка...</div>
  }

  if (items.length === 0) {
    return (
      <div style={layout.page}>
        <div 
          style={{
            ...layout.centered,
            ...(isMobile && mobileStyles.centeredMobile)
          }}
        >
          <TopBar title="Избранное" />
          
          <div style={styles.empty}>
            <Heart size={48} color="#b0b0b0" />
            <div style={styles.emptyText}>Нет избранных товаров</div>
            <button style={styles.homeBtn} onClick={() => navigate('/')}>
              Перейти к объявлениям
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={layout.page}>
      <div 
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >
        <TopBar title="Избранное" />

        <div 
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          <div 
            style={{
              ...styles.grid,
              ...(isMobile && mobileStyles.gridMobile)
            }}
          >
            {items.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
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

const styles = {
  container: {
    padding: '110px 16px 80px',
    textAlign: 'center' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    justifyContent: 'center',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
    gap: '16px',
    textAlign: 'center' as const,
    paddingTop: '60px',
  },
  emptyText: {
    color: '#666',
    fontSize: '15px',
  },
  homeBtn: {
    padding: '10px 18px',
    background: '#5664c1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
    marginTop: '4px',
  }
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  containerMobile: {
    padding: '90px 12px 80px',
  },
  gridMobile: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
}
