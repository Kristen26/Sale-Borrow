import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider'
import { isFavorite, toggleFavorite } from '../lib/favorites'
import type { Tables } from '../types/database.types'

type Item = Tables<'items'>

export default function ItemCard({ item }: { item: Item }) {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [fav, setFav] = useState(false)

  useEffect(() => {
    if (!session) return
    isFavorite(session.user.id, item.id).then(setFav)
  }, [session, item.id])

  const handleFav = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    if (!session) {
      navigate('/auth')
      return
    }

    await toggleFavorite(session.user.id, item.id)
    setFav(prev => !prev)
  }

  const getDealLabel = () => {
    if (item.deal_type === 'sale') return 'Продажа'
    if (item.deal_type === 'rent') return 'Аренда'
    if (item.deal_type === 'gift') return 'Даром'
    return ''
  }

  return (
    <div
      style={styles.card}
      onClick={() => navigate(`/item/${item.id}`)}
    >
      {/* 📸 КАРТИНКА */}
      <div style={styles.imageWrap}>
        {item.image_urls?.[0] ? (
          <img src={item.image_urls[0]} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>Нет фото</div>
        )}

        {/* ❤️ избранное */}
        <button onClick={handleFav} style={styles.heart}>
          {fav ? '❤️' : '🤍'}
        </button>

        {/* 🏷 тип */}
        <div style={styles.badge}>
          {getDealLabel()}
        </div>
      </div>

      {/* 📄 ИНФА */}
      <div style={styles.body}>
        <div style={styles.price}>
          {item.price ? `${item.price} ₽` : 'Бесплатно'}
        </div>

        <div style={styles.title}>
          {item.title}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #eee',
    transition: '0.2s',
  },

  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    background: '#f2f2f2',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: '#aaa',
  },

  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },

  badge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    background: '#5664c1',
    color: '#fff',
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '8px',
  },

  body: {
    padding: '10px',
  },

  price: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '4px',
  },

  title: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.3',
    height: '36px',
    overflow: 'hidden',
  },
}