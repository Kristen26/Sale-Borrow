import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { Star } from 'lucide-react'

export default function ScorePage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [comment])

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
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

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
    <div style={layout.page}>
      <div 
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >
        <div 
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          <div 
            style={{
              ...styles.card,
              ...(isMobile && mobileStyles.cardMobile)
            }}
          >
            <h1 style={styles.title}>Оценка продавца</h1>

            <div style={styles.label}>Оценка</div>

            <div style={styles.stars}>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  style={styles.starBtn}
                >
                  <Star 
                    size={32} 
                    fill={rating >= num ? '#ffb300' : 'transparent'} 
                    color={rating >= num ? '#ffb300' : '#ccc'} 
                  />
                </button>
              ))}
            </div>

            <div style={styles.label}>Отзыв</div>

            <textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Напишите отзыв"
              style={styles.textarea}
              rows={1}
            />

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              style={styles.button}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
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
    padding: '40px 16px 80px',
    textAlign: 'center',
  },
  card: {
    maxWidth: '1100px',
    width: '100%',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '28px',
    color: '#111',
    textAlign: 'left',
  },
  label: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '10px',
    textAlign: 'left',
    color: '#333',
  },
  stars: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    justifyContent: 'flex-start',
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    overflowY: 'hidden',
    resize: 'none',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #dcdcdc',
    fontSize: '15px',
    marginBottom: '24px',
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: '1.5',
    display: 'block',
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
    boxSizing: 'border-box',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  containerMobile: {
    padding: '16px 12px 80px',
  },
  cardMobile: {
    padding: '20px 16px',
  },
}
