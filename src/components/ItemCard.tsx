import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider'
import { isFavorite, toggleFavorite } from '../lib/favorites'
import type { Tables } from '../types/database.types'
import { Heart, ImageIcon } from 'lucide-react'

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

      <div style={styles.imageWrap}>

        {item.image_urls?.[0] ? (

          <img
            src={item.image_urls[0]}
            alt={item.title}
            style={styles.image}
          />

        ) : (

          <div style={styles.placeholder}>
            <ImageIcon size={42} color="#bdbdbd" />
          </div>
        )}

        <button onClick={handleFav}
          style={styles.heart}>
          <Heart
            size={20}
            fill={fav ? '#ff3b5c' : 'transparent'}
            color={fav ? '#ff3b5c' : '#222'}
          />
        </button>

        <div style={styles.badge}>
          {getDealLabel()}
        </div>

      </div>

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

const styles: Record<string, React.CSSProperties > = {
  card: {
    background: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #efefef',
    transition: '0.2s ease',
    display: 'flex',
    flexDirection: 'column',
  },

  imageWrap: {
    position: 'relative',
    width: '100%',
    height: '220px',
    background: '#f6f6f6',
    overflow: 'hidden',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  },

  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f8f8',
  },

  heart: {
    position: 'absolute',
    top: '10px',
    right: '10px',

    width: '38px',
    height: '38px',

    borderRadius: '50%',
    border: 'none',

    background: 'rgba(255,255,255,0.94)',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    cursor: 'pointer',

    backdropFilter: 'blur(10px)',

    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },

  badge: {
    position: 'absolute',
    left: '10px',
    bottom: '10px',

    background: '#5664c1',
    color: '#fff',

    fontSize: '11px',
    padding: '7px 11px',

    borderRadius: '999px',
    fontWeight: 600,

    backdropFilter: 'blur(6px)',
  },

  body: {
    padding: '14px 14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  price: {
    fontSize: '19px',
    fontWeight: 700,
    color: '#111',
    lineHeight: 1.2,
  },

  title: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',

    overflow: 'hidden',

    fontSize: '14px',
    lineHeight: '1.45',
    color: '#555',

    minHeight: '40px',
    wordBreak: 'break-word',
  },
}