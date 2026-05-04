import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { isFavorite, toggleFavorite } from '../lib/favorites'
import ChatButton from '../components/ButWriten'
import type { Tables } from '../types/database.types'

type Item = Tables<'items'>
type Profile = Tables<'profiles'>

type ItemWithOwner = Item & {
  owner: Profile
}

export default function CartPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState<ItemWithOwner | null>(null)
  const [fav, setFav] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('items')
        .select(`
          *,
          owner:profiles(*)
        `)
        .eq('id', id)
        .single()

      if (data) setItem(data as ItemWithOwner)

      setLoading(false)
    }

    load()
  }, [id])

  useEffect(() => {
    if (!session || !item) return
    isFavorite(session.user.id, item.id).then(setFav)
  }, [session, item])

  const handleFav = async () => {
    if (!session || !item) {
      navigate('/auth')
      return
    }

    await toggleFavorite(session.user.id, item.id)
    setFav(prev => !prev)
  }

  if (loading) return <div style={{ padding: 16 }}>Загрузка...</div>
  if (!item) return <div style={{ padding: 16 }}>Товар не найден</div>

  return (
    <div style={styles.container}>

      {/* ФОТО */}
      <div style={styles.imageWrap}>
        {item.image_urls?.[0] ? (
          <img src={item.image_urls[0]} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>Нет фото</div>
        )}
      </div>

      {/* КОНТЕНТ */}
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>{item.title}</h1>

          <button onClick={handleFav} style={styles.favBtn}>
            {fav ? '❤️' : '🤍'}
          </button>
        </div>

        <div style={styles.price}>{item.price} ₽</div>

        <p style={styles.description}>
          {item.description || 'Без описания'}
        </p>

        {/* ПРОДАВЕЦ */}
        <div style={styles.sellerCard}>
          <div style={styles.sellerLeft}>
            {item.owner.avatar_url ? (
              <img src={item.owner.avatar_url} style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>👤</div>
            )}

            <div>
              <div style={styles.sellerName}>
                {item.owner.first_name} {item.owner.last_name || ''}
              </div>
            </div>
          </div>
        </div>

        {/* КНОПКА */}
        <div style={styles.chatWrap}>
          <ChatButton
            itemId={item.id}
            sellerId={item.owner_id}
          />
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    paddingBottom: '80px',
  },

  imageWrap: {
    width: '100%',
    height: '400px',
    backgroundColor: '#eee',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  
  title: {
  fontSize: '20px',
  fontWeight: 600,
  margin: 0,
  textAlign: 'left', // 👈
},

  price: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '12px',
    textAlign: 'left', // 👈
  },

  description: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '20px',
    textAlign: 'left', // 👈
  },

  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '14px',
  },

  content: {
    padding: '16px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // 👈 было 'left' (ошибка)
    marginBottom: '8px',
  },

  favBtn: {
    fontSize: '22px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },

  sellerCard: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #eee',
  },

  sellerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  avatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sellerName: {
    fontSize: '14px',
    fontWeight: 500,
  },

  rating: {
    fontSize: '12px',
    color: '#888',
  },

  chatWrap: {
    marginTop: '16px',
  },
}