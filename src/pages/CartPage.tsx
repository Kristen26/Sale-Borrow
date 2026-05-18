import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, ChevronLeft, ChevronRight, ImageIcon, Star } from 'lucide-react'
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

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    return <div style={styles.loading}>Загрузка...</div>
  }

  if (!item) {
    return <div style={styles.loading}>Товар не найден</div>
  }

  return (
    <div
      style={{
        ...styles.page,
        ...(isMobile && mobileStyles.pageMobile),
      }}
    >
      <div
        style={{
          ...styles.container,
          ...(isMobile && mobileStyles.containerMobile),
        }}
      >
        <div style={styles.imageWrap}>
          {item.image_urls?.length ? (
            <>
              <img
                src={item.image_urls[currentImage]}
                alt={item.title}
                style={styles.image}
              />

              {item.image_urls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    style={{
                      ...styles.arrow,
                      left: '14px',
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    onClick={nextImage}
                    style={{
                      ...styles.arrow,
                      right: '14px',
                    }}
                  >
                    <ChevronRight size={24} />
                  </button>

                  <div style={styles.dots}>
                    {item.image_urls.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          ...styles.dot,
                          background:
                            index === currentImage
                              ? '#fff'
                              : 'rgba(255,255,255,0.45)',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={styles.placeholder}>
              <ImageIcon size={56} color="#bdbdbd" />
            </div>
          )}
        </div>

        <div
          style={{
            ...styles.content,
            ...(isMobile && mobileStyles.contentMobile),
          }}
        >
          <div style={styles.header}>
            <div style={styles.titleBlock}>
              <h1 style={styles.title}>{item.title}</h1>
              <div style={styles.price}>{item.price} ₽</div>
            </div>

            <button onClick={handleFav} style={styles.favBtn}>
              <Heart
                size={26}
                fill={fav ? '#ff3b5c' : 'transparent'}
                color={fav ? '#ff3b5c' : '#222'}
              />
            </button>
          </div>

          <div style={styles.description}>
            {item.description || 'Без описания'}
          </div>

          <div
            style={styles.sellerCard}
            onClick={() => navigate(`/buyer/${item.owner.id}`)}
          >
            <div style={styles.sellerLeft}>
              {item.owner.avatar_url ? (
                <img src={item.owner.avatar_url} alt="" style={styles.avatar} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <ImageIcon size={24} color="#a0a0a0" />
                </div>
              )}

              <div style={styles.sellerInfo}>
                <div style={styles.sellerLabel}>Продавец</div>
                <div style={styles.sellerName}>
                  {item.owner.first_name} {item.owner.last_name || ''}
                </div>
                <div style={styles.ratingRow}>
                  <Star size={14} fill="#ffb300" color="#ffb300" />
                  <span style={styles.ratingText}>
                    {item.owner.rating ? item.owner.rating.toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
            </div>

            <ChevronRight size={20} color="#999" />
          </div>

          <div style={styles.chatWrap}>
            <ChatButton itemId={item.id} sellerId={item.owner_id} />
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: '#f5f5f5',
    minHeight: '100vh',
    padding: '24px',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    fontSize: '18px',
  },
  imageWrap: {
    width: '100%',
    height: '420px',
    background: '#f2f2f2',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#f7f7f7',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  dots: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  content: {
    padding: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    width: '100%',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    flex: 1,
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: '#222',
    textAlign: 'left',
  },
  price: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#5664c1',
    textAlign: 'left',
  },
  favBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    marginLeft: '16px',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '24px',
    whiteSpace: 'pre-line',
    textAlign: 'left',
  },
  sellerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    border: '1px solid #eaeaea',
    borderRadius: '16px',
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'background 0.2s ease, border-color 0.2s ease',
  },
  sellerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sellerInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  sellerLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #eee',
  },
  avatarPlaceholder: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e0e0e0',
  },
  sellerName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
    textAlign: 'left',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  ratingText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#222',
  },
  chatWrap: {
    width: '100%',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  pageMobile: {
    padding: '12px',
  },
  containerMobile: {
    borderRadius: '0',
    boxShadow: 'none',
  },
  contentMobile: {
    padding: '16px',
  },
}
