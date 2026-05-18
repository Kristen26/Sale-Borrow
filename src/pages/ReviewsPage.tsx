import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TopBar from '../components/TopBar'
import { Star, User } from 'lucide-react'
import type { Tables } from '../types/database.types'

type Review = Tables<'reviews'> & {
    author: {
        first_name: string
        last_name: string | null
        avatar_url: string | null
    } | null
    }

    export default function ReviewsPage() {
    const { id } = useParams<{ id: string }>()

    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (!id) return

        const loadReviews = async () => {
        setLoading(true)

        const { data } = await supabase
            .from('reviews')
            .select(`
            *,
            author:profiles!reviews_author_id_fkey(first_name, last_name, avatar_url)
            `)
            .eq('seller_id', id)
            .order('created_at', { ascending: false })

        if (data) {
            setReviews(data as unknown as Review[])
        }

        setLoading(false)
        }

        loadReviews()
    }, [id])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        }).replace(' г.', '')
    }

    if (loading) {
        return <div style={{ padding: 20, textAlign: 'center', fontSize: '15px' }}>Загрузка...</div>
    }

    return (
        <div style={layout.page}>
        <div 
            style={{
            ...layout.centered,
            ...(isMobile && mobileStyles.centeredMobile)
            }}
        >
            <TopBar title="Отзывы" />

            <div 
            style={{
                ...styles.container,
                ...(isMobile && mobileStyles.containerMobile)
            }}
            >
            {reviews.length === 0 && (
                <div style={styles.empty}>
                <div>Нет отзывов</div>
                </div>
            )}

            <div style={styles.list}>
                {reviews.map((review) => (
                <div key={review.id} style={styles.reviewCard}>
                    
                    <div style={styles.headerRow}>
                    <div style={styles.userInfo}>
                        <div style={styles.avatar}>
                        {review.author?.avatar_url ? (
                            <img 
                            src={review.author.avatar_url} 
                            alt="" 
                            style={styles.avatarImg} 
                            />
                        ) : (
                            <User size={20} color="#999" />
                        )}
                        </div>

                        <div style={styles.authorMeta}>
                        <div style={styles.authorName}>
                            {review.author ? `${review.author.first_name} ${review.author.last_name || ''}` : 'Пользователь'}
                        </div>
                        
                        <div style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((num) => (
                            <Star 
                                key={num}
                                size={14} 
                                fill={review.rating >= num ? '#ffb300' : 'transparent'} 
                                color={review.rating >= num ? '#ffb300' : '#ccc'} 
                            />
                            ))}
                        </div>
                        </div>
                    </div>

                    {review.created_at && (
                        <div style={styles.dateText}>
                        {formatDate(review.created_at)}
                        </div>
                    )}
                    </div>

                    {review.comment && (
                    <div style={styles.commentText}>
                        {review.comment}
                    </div>
                    )}

                </div>
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
        padding: '110px 16px 60px',
        textAlign: 'left',
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
    },
    reviewCard: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '16px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        width: '100%',
        gap: '14px',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '40px',
        height: '40px',
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
    authorMeta: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    authorName: {
        fontSize: '15px',
        fontWeight: 600,
        color: '#111',
        lineHeight: '1.3',
    },
    starsRow: {
        display: 'flex',
        gap: '3px',
        marginTop: '4px',
    },
    dateText: {
        fontSize: '13px',
        color: '#999',
        whiteSpace: 'nowrap',
    },
    commentText: {
        fontSize: '15px',
        color: '#333',
        lineHeight: '1.5',
        whiteSpace: 'pre-line',
        textAlign: 'left',
        width: '100%',
        wordBreak: 'break-word',
    },
    empty: {
        color: '#888',
        fontSize: '15px',
        textAlign: 'center',
        padding: '40px 0',
        width: '100%',
    },
}

const mobileStyles: Record<string, React.CSSProperties> = {
    centeredMobile: {
        maxWidth: '100%',
    },
    containerMobile: {
        padding: '90px 12px 60px',
    },
}
