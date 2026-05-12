import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider'
import { isFavorite, toggleFavorite } from '../lib/favorites'
import type { Tables } from '../types/database.types'

type Item = Tables<'items'>

export default function ItemCard({
  item,
}: {
  item: Item
}) {

  const navigate = useNavigate()

  const { session } = useAuth()

  const [fav, setFav] = useState(false)

  useEffect(() => {

    if (!session) return

    isFavorite(
      session.user.id,
      item.id
    ).then(setFav)

  }, [session, item.id])

  const handleFav = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {

    e.stopPropagation()

    if (!session) {

      navigate('/auth')

      return
    }

    await toggleFavorite(
      session.user.id,
      item.id
    )

    setFav(prev => !prev)
  }

  const getDealLabel = () => {

    if (item.deal_type === 'sale') {
      return 'Продажа'
    }

    if (item.deal_type === 'rent') {
      return 'Аренда'
    }

    if (item.deal_type === 'gift') {
      return 'Даром'
    }

    return ''
  }

  return (

    <div
      style={styles.card}
      onClick={() =>
        navigate(`/item/${item.id}`)
      }
    >

      {/* IMAGE */}
      <div style={styles.imageWrap}>

        {item.image_urls?.[0] ? (

          <img
            src={item.image_urls[0]}
            alt={item.title}
            style={styles.image}
          />

        ) : (

          <div style={styles.placeholder}>
            Нет фото
          </div>

        )}

        {/* GRADIENT */}
        <div style={styles.gradient} />

        {/* FAVORITE */}
        <button
          onClick={handleFav}
          style={styles.heart}
        >
          {fav ? '❤️' : '🤍'}
        </button>

        {/* TYPE */}
        <div style={styles.badge}>
          {getDealLabel()}
        </div>

      </div>

      {/* BODY */}
      <div style={styles.body}>

        <div style={styles.price}>
          {item.price
            ? `${item.price} ₽`
            : 'Бесплатно'}
        </div>

        <div style={styles.title}>
          {item.title}
        </div>

      </div>

    </div>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {

  card: {
    background: '#fff',
    borderRadius: '18px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #ececec',
    transition: '0.2s ease',
    boxShadow:
      '0 2px 10px rgba(0,0,0,0.04)',
  },

  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    background: '#f2f2f2',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#999',
    background: '#f5f5f5',
  },

  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70px',
    background:
      'linear-gradient(to top, rgba(0,0,0,0.45), transparent)',
    pointerEvents: 'none',
  },

  heart: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.95)',
    cursor: 'pointer',
    fontSize: '16px',
    backdropFilter: 'blur(4px)',
  },

  badge: {
    position: 'absolute',
    left: '10px',
    bottom: '10px',
    background: '#5664c1',
    color: '#fff',
    fontSize: '11px',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: 500,
  },

  body: {
    padding: '12px',
  },

  price: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '6px',
    color: '#111',
  },

  title: {
    fontSize: '14px',
    color: '#444',
    lineHeight: '1.4',
    height: '40px',
    overflow: 'hidden',
  },
}