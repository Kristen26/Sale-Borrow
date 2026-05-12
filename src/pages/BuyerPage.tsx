import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import ItemCard from '../components/card'
import type { Tables } from '../types/database.types'

type Profile = Tables<'profiles'>
type Item = Tables<'items'>

export default function BuyerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [rating, setRating] = useState<number>(0)

  useEffect(() => {
    if (!id) return

    const load = async () => {

      // ПРОДАВЕЦ
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // ОБЪЯВЛЕНИЯ
      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', id)
        .eq('is_active', true)

      setItems(itemsData || [])

      // РЕЙТИНГ
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', id)

      if (reviews?.length) {
        const avg =
          reviews.reduce((sum, r) => sum + r.rating, 0) /
          reviews.length

        setRating(Number(avg.toFixed(1)))
      }
    }

    load()
  }, [id])

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>

        <div style={styles.avatar}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} style={styles.avatarImg} />
          ) : (
            '👤'
          )}
        </div>

        <div style={styles.name}>
          {profile?.first_name} {profile?.last_name || ''}
        </div>

        <div style={styles.rating}>
          ⭐ {rating || 'Нет оценок'}
        </div>

        <button
          style={styles.scoreBtn}
          onClick={() => navigate(`/score/${profile?.id}`)}
        >
          Оценить продавца
        </button>

      </div>

      {/* ОБЪЯВЛЕНИЯ */}
      <div style={styles.sectionTitle}>
        Активные объявления
      </div>

      <div style={styles.grid}>
        {items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {

  page: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },

  header: {
    background: '#fff',
    borderRadius: '18px',
    padding: '24px',
    marginBottom: '24px',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  avatar: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: '#eee',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
    fontSize: '34px',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  name: {
    marginTop: '12px',
    fontSize: '24px',
    fontWeight: 600,
  },

  rating: {
    marginTop: '6px',
    color: '#666',
    fontSize: '16px',
  },

  scoreBtn: {
    marginTop: '16px',
    background: '#5664c1',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 18px',
    cursor: 'pointer',
  },

  sectionTitle: {
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '16px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
}