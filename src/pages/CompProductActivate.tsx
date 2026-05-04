import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import MyItemCard from '../components/MyItemCard'
import type { Tables } from '../types/database.types'

type Item = Tables<'items'>

export default function CompProductActivate() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

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
        .eq('is_active', false)
        .order('created_at', { ascending: false })

      if (data) setItems(data)

      setLoading(false)
    }

    load()
  }, [session, navigate])

  const restoreItem = async (id: string) => {
    await supabase
      .from('items')
      .update({ is_active: true })
      .eq('id', id)

    setItems(prev => prev.filter(i => i.id !== id))
  }

  if (loading) return <div style={{ padding: 16 }}>Загрузка...</div>

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.back}>
        ← Назад
      </button>

      <h1 style={styles.title}>Завершённые объявления</h1>

      {items.length === 0 && (
        <div style={styles.empty}>Нет завершённых</div>
      )}

      {items.map(item => (
        <MyItemCard
          key={item.id}
          item={item}
          onEdit={() => navigate(`/edit/${item.id}`)}
          onAction={() => restoreItem(item.id)}
          actionText="Восстановить"
          actionStyle={styles.restore}
        />
      ))}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '12px',
    paddingBottom: '80px',
  },
  back: {
    marginBottom: '10px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  empty: {
    color: '#888',
    fontSize: '13px',
  },
  restore: {
    padding: '6px',
    borderRadius: '8px',
    border: 'none',
    background: '#4caf50',
    color: '#fff',
    cursor: 'pointer',
  },
}