import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'

export default function ScorePage() {

  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {

    if (!session || !id) return

    try {
      setLoading(true)

      if (session.user.id === id) {
        alert('Нельзя оценивать самого себя')
        return
      }

      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('seller_id', id)
        .eq('author_id', session.user.id)
        .maybeSingle()

      if (existing) {
        alert('Вы уже оставляли отзыв')
        return
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          seller_id: id,
          author_id: session.user.id,
          rating,
          comment,
        })

      if (error) {
        console.error(error)
        alert('Ошибка создания отзыва')
        return
      }

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', id)

      if (reviews?.length) {

        const avg =
          reviews.reduce((sum, r) => sum + r.rating, 0) /
          reviews.length

        await supabase
          .from('profiles')
          .update({
            rating: Number(avg.toFixed(1))
          })
          .eq('id', id)
      }

      alert('Отзыв сохранён')

      navigate(-1)

    } catch (e) {

      console.error(e)
      alert('Ошибка')

    } finally {

      setLoading(false)

    }
  }

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          Оценка продавца
        </h1>

        <div style={styles.label}>
          Оценка
        </div>

        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={num}
              onClick={() => setRating(num)}
              style={{
                ...styles.starBtn,
                opacity: rating >= num ? 1 : 0.35,
              }}
            >
              0
            </button>
          ))}
        </div>

        <div style={styles.label}>
          Отзыв
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Напишите отзыв'
          style={styles.textarea}
        />

        <button
          onClick={handleSave}
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>

      </div>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {

  page: {
    minHeight: '100vh',
    background: '#f4f4f4',
    padding: '40px 20px',
  },

  card: {
    maxWidth: '700px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },

  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '28px',
  },

  label: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '10px',
  },

  stars: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
  },

  starBtn: {
    background: 'none',
    border: 'none',
    fontSize: '34px',
    cursor: 'pointer',
    transition: '0.2s',
  },

  textarea: {
    width: '100%',
    minHeight: '140px',
    resize: 'vertical',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #dcdcdc',
    fontSize: '15px',
    marginBottom: '24px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  button: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: '#5664c1',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}