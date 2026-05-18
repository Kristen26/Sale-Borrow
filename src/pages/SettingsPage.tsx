import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { Star } from 'lucide-react'
import type { Tables } from '../types/database.types'
import type { ChangeEvent } from 'react'

type Profile = Tables<'profiles'>

export default function SettingsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!session) {
      navigate('/auth')
      return
    }

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) setProfile(data)
      setLoading(false)
    }

    load()
  }, [session, navigate])

  const handleSave = async () => {
    if (!profile) return

    await supabase
      .from('profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
      })
      .eq('id', profile.id)

    alert('Сохранено')
  }

  const handleUploadAvatar = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return
    if (!profile) return

    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}.${fileExt}`

    if (profile.avatar_url) {
      const oldFileName = profile.avatar_url.split('/').pop()
      if (oldFileName) {
        await supabase.storage
          .from('avatars')
          .remove([oldFileName])
      }
    }

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
      })

    if (error) {
      console.log(error)
      alert('Ошибка загрузки')
      return
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const publicUrl = data.publicUrl

    await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
      })
      .eq('id', profile.id)

    setProfile(prev =>
      prev
        ? {
            ...prev,
            avatar_url: publicUrl,
          }
        : prev
    )
  }

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Вы уверены, что хотите выйти из аккаунта?')
    if (!confirmLogout) return

    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'left' }}>Загрузка...</div>

  return (
    <div style={layout.page}>
      <div
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >
        <TopBar title="Профиль" />

        <div
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          <div style={styles.avatarWrap}>
            <div style={styles.avatar}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} style={styles.avatarImg} alt="" />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {profile?.first_name
                    ? profile.first_name.charAt(0).toUpperCase()
                    : 'Фото'}
                </div>
              )}
            </div>
            <label style={styles.avatarBtn}>
              Загрузить фото
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleUploadAvatar}
              />
            </label>
          </div>

          <div style={styles.accountBox}>
            <div style={styles.accountLabel}>Вы вошли как:</div>
            <div style={styles.accountEmail}>
              {session?.user?.email || '—'}
            </div>
          </div>

          <div style={styles.ratingBox}>
            <div style={styles.ratingLabel}>Рейтинг продавца</div>
            <div style={styles.ratingRow}>
              <Star size={20} fill="#5664c1" color="#5664c1" />
              <div style={styles.ratingValue}>
                {profile?.rating ? profile.rating.toFixed(1) : '0.0'}
              </div>
            </div>
          </div>

          <input
            value={profile?.first_name ?? ''}
            onChange={(e) =>
              setProfile(prev => prev ? { ...prev, first_name: e.target.value } : prev)
            }
            placeholder="Имя"
            style={styles.input}
          />

          <input
            value={profile?.last_name ?? ''}
            onChange={(e) =>
              setProfile(prev => prev ? { ...prev, last_name: e.target.value } : prev)
            }
            placeholder="Фамилия"
            style={styles.input}
          />

          <button onClick={handleSave} style={styles.saveBtn}>
            Сохранить
          </button>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Мои объявления</h2>

            <button
              onClick={() => navigate('/my/active')}
              style={styles.linkBtn}>
              Активные
            </button>

            <button
              onClick={() => navigate('/my/completed')}
              style={styles.linkBtn}
            >
              Завершённые
            </button>
          </div>

          <button onClick={handleLogout} style={styles.logout}>
            Выйти
          </button>
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
    maxWidth: '600px',
    margin: '0 auto',
  },

  avatarWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '8px',
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
    border: '1px solid #ddd',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  avatarBtn: {
    fontSize: '14px',
    background: 'none',
    border: 'none',
    color: '#5664c1',
    cursor: 'pointer',
    fontWeight: 500,
  },
  
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 600,
    color: '#777',
  },

  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
  },

  saveBtn: {
    padding: '12px',
    width: '100%',
    background: '#5664c1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    marginBottom: '24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },

  section: {
    marginBottom: '24px',
    textAlign: 'left',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#111',
    textAlign: 'left',
  },

  linkBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    marginBottom: '8px',
    background: '#fff',
    cursor: 'pointer',
    color: '#333',
    fontSize: '15px',
    boxSizing: 'border-box',
  },

  logout: {
    width: '100%',
    padding: '12px',
    background: '#fff',
    color: '#ff3b30',
    borderRadius: '10px',
    cursor: 'pointer',
    border: '1px solid #ff3b30',
    fontSize: '15px',
    fontWeight: 500,
    boxSizing: 'border-box',
  },

  accountBox: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '16px',
    textAlign: 'left',
  },

  accountLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
    textAlign: 'left',
  },

  accountEmail: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#333',
    textAlign: 'left',
  },

  ratingBox: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '16px',
    textAlign: 'left',
  },

  ratingLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '6px',
    textAlign: 'left',
  },

  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'flex-start',
  },

  ratingValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#5664c1',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  containerMobile: {
    padding: '16px 12px 80px',
  },
}
