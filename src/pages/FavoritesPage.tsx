import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import ItemCard from '../components/ItemCard'
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
    return <div style={{ padding: 20 }}>Загрузка...</div>
  }

  if (items.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emoji}>❤️</div>
        <div>Нет избранных товаров</div>
        <button onClick={() => navigate('/')}>
          Перейти к объявлениям
        </button>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Избранное</h1>

      <div style={styles.grid}>
        {items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '12px',
    paddingBottom: '80px'
  },
  title: {
    fontSize: '18px',
    marginBottom: '12px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
    gap: '12px'
  },
  emoji: {
    fontSize: '40px'
  }
}