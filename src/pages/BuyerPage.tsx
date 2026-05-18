import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import ItemCard from '../components/ItemCard'
import TopBar from '../components/TopBar'
import type { Tables } from '../types/database.types'
import { Star, User } from 'lucide-react'

type Profile = Tables<'profiles'>
type Item = Tables<'items'>

export default function BuyerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [rating, setRating] = useState<number>(0)

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', id)
        .eq('is_active', true)

      setItems(itemsData || [])

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', id)

      if (reviews?.length) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        setRating(Number(avg.toFixed(1)))
      }
    }

    load()
  }, [id])

  const isOwnProfile = session?.user?.id === id

  return (
    <div style={layout.page}>
      <div 
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >
        <TopBar title="Продавец" />

        <div 
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          <div 
            style={{
              ...styles.header,
              ...(isMobile && mobileStyles.headerMobile)
            }}
          >
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    style={styles.avatarImg}
                  />
                ) : (
                  <User size={24} color="#999" />
                )}
              </div>

              <div style={styles.meta}>
                <div style={styles.name}>
                  {profile?.first_name} {profile?.last_name || ''}
                </div>

                <div style={styles.ratingWrap}>
                  <div style={styles.rating}>
                    <Star size={14} fill="#f5b301" color="#f5b301" />
                    <span>{rating || 'Нет оценок'}</span>
                  </div>
                  
                  <button 
                    style={styles.reviewsLink}
                    onClick={() => navigate(`/reviews/${id}`)}
                  >
                    читать отзывы
                  </button>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <button
                style={{
                  ...styles.scoreBtn,
                  ...(isMobile && mobileStyles.scoreBtnMobile)
                }}
                onClick={() => navigate(`/score/${profile?.id}`)}
              >
                Оценить продавца
              </button>
            )}
          </div>

          <div style={styles.sectionTitle}>Активные объявления</div>

          <div
            style={{
              ...styles.grid,
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '110px 16px 80px',
    textAlign: 'left',
  },

  header: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px 20px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #eee',
    gap: '16px',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  meta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#f3f3f3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid #eaeaea',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  name: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111',
    textAlign: 'left',
  },

  ratingWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },

  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#666',
    fontSize: '14px',
    fontWeight: 500,
  },

  reviewsLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#5664c1',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  scoreBtn: {
    border: 'none',
    borderRadius: '10px',
    background: '#5664c1',
    color: '#fff',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '14px',
    color: '#111',
    textAlign: 'left',
  },

  grid: {
    display: 'grid',
    gap: '16px',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  containerMobile: {
    padding: '90px 12px 80px',
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: '16px',
  },
  scoreBtnMobile: {
    width: '100%',
    textAlign: 'center',
    marginTop: '6px',
  },
}
