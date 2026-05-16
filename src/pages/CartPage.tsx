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

  const [currentImage, setCurrentImage] = useState(0)

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

      if (data) {
        setItem(data as ItemWithOwner)
      }

      setLoading(false)
    }

    load()

  }, [id])

  // FAVORITES
  useEffect(() => {

    if (!session || !item) return

    isFavorite(session.user.id, item.id)
      .then(setFav)

  }, [session, item])

  const handleFav = async () => {

    if (!session || !item) {
      navigate('/auth')
      return
    }

    await toggleFavorite(session.user.id, item.id)

    setFav(prev => !prev)
  }

  const nextImage = () => {

    if (!item?.image_urls?.length) return

    setCurrentImage(prev => {

      if (prev >= item.image_urls.length - 1) {
        return 0
      }

      return prev + 1
    })
  }

  const prevImage = () => {

    if (!item?.image_urls?.length) return

    setCurrentImage(prev => {

      if (prev <= 0) {
        return item.image_urls.length - 1
      }

      return prev - 1
    })
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Загрузка...
      </div>
    )
  }

  if (!item) {
    return (
      <div style={styles.loading}>
        Товар не найден
      </div>
    )
  }

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        <div style={styles.imageWrap}>

          {item.image_urls?.length ? (

            <>
              <img
                src={item.image_urls[currentImage]}
                style={styles.image}
              />

              {item.image_urls.length > 1 && (
                <div style={styles.dots}>

                  {item.image_urls.map((_, index) => (

                    <div
                      key={index}
                      style={{
                        ...styles.dot,

                        background:
                          index === currentImage
                            ? '#fff'
                            : 'rgba(255,255,255,0.5)',
                      }}
                    />

                  ))}

                </div>
              )}
            </>

          ) : (

            <div style={styles.placeholder}>
              Нет фото
            </div>

          )}

        </div>

        <div style={styles.content}>

          <div style={styles.header}>

            <h1 style={styles.title}>
              {item.title}
            </h1>

            <button
              onClick={handleFav}
              style={styles.favBtn}
            >
              {fav ? '❤️' : '🤍'}
            </button>

          </div>

          <div style={styles.price}>
            {item.price} ₽
          </div>

          <div style={styles.description}>
            {item.description || 'Без описания'}
          </div>

          <div
            style={styles.sellerCard}
            onClick={() => navigate(`/buyer/${item.owner.id}`)}

            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5'
            }}

            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff'
            }}
          >

            <div style={styles.sellerLeft}>

              {item.owner.avatar_url ? (
                <img
                  src={item.owner.avatar_url}
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  Фото
                </div>
              )}

              <div>

                <div style={styles.sellerName}>
                  {item.owner.first_name} {item.owner.last_name || ''}
                </div>

                <div style={styles.rating}>
                  Рейтинг {item.owner.rating || 0}
                </div>

              </div>

            </div>

          </div>

          <div style={styles.chatWrap}>

            <ChatButton
              itemId={item.id}
              sellerId={item.owner_id}
            />

          </div>

        </div>

      </div>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {

  page: {
    background: '#f4f4f4',
    minHeight: '100vh',
    padding: '24px',
  },

  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '22px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },

  loading: {
    padding: '40px',
    textAlign: 'center',
    fontSize: '18px',
  },

  imageWrap: {
    width: '100%',
    height: '520px',
    background: '#eee',
    position: 'relative',
    overflow: 'hidden',
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

    color: '#888',
    fontSize: '16px',
  },

  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',

    width: '46px',
    height: '46px',

    borderRadius: '50%',
    border: 'none',

    background: 'rgba(0,0,0,0.45)',
    color: '#fff',

    fontSize: '34px',
    cursor: 'pointer',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dots: {
    position: 'absolute',
    bottom: '18px',
    left: '50%',
    transform: 'translateX(-50%)',

    display: 'flex',
    gap: '8px',
  },

  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },

  content: {
    padding: '24px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '12px',
  },

  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 700,
    color: '#111',
  },

  favBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '32px',
  },

  price: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#5664c1',
    marginBottom: '18px',
  },

  description: {
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#444',
    marginBottom: '28px',
  },

  sellerCard: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '16px',
    padding: '16px',
    cursor: 'pointer',
    transition: '0.2s',
  },

  sellerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  avatarPlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#ddd',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    fontSize: '26px',
  },

  sellerName: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '4px',
  },

  rating: {
    fontSize: '14px',
    color: '#666',
  },

  chatWrap: {
    marginTop: '22px',
  },
}