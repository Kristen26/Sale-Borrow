import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { useNavigate } from 'react-router-dom'
import type { Tables } from '../types/database.types'
import type { ChangeEvent } from 'react'

type Profile = Tables<'profiles'>

export default function SettingsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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

      const oldFileName =
        profile.avatar_url.split('/').pop()

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
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>

  return (
    <div style={styles.page}>
        <h1 style={styles.title}>Профиль</h1>

      <div style={styles.avatarWrap}>
        <div style={styles.avatar}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} style={styles.avatarImg} />
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

          <div style={styles.ratingLabel}>
            Рейтинг продавца
          </div>

          <div style={styles.ratingValue}>
            Рейтинг {profile?.rating?.toFixed(1) || '0.0'}
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
          style={styles.linkBtn}
        >
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
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '16px',
    paddingBottom: '80px',
  },

  title: {
    fontSize: '24px',
    marginBottom: '16px',
  },

  avatarWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '8px',
  },

  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    overflow: 'hidden',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  avatarBtn: {
    fontSize: '13px',
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
  },
  
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 600,
    color: '#555',
  },

  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '10px',
    border: '1px solid #ddd',
  },

  saveBtn: {
    padding: '10px',
    width: '100%',
    background: '#5664c1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    marginBottom: '20px',
  },

  section: {
    marginBottom: '20px',
  },

  sectionTitle: {
    fontSize: '20px',
    marginTop: '15px',
    marginBottom: '15px',
  },

  linkBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '10px',
    border: '0.3px solid #ffffff',
    borderRadius: '10px',
    marginBottom: '8px',
    background: '#dddddd',
    cursor: 'pointer',
    color: '#3e3c3c',
  },

  logout: {
    width: '100%',
    padding: '10px',
    background: '#ffffff',
    color: '#000000',
    borderRadius: '10px',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: '#000000',
  },

  accountBox: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '16px',
  },

  accountLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
  },

  accountEmail: {
      fontSize: '14px',
      fontWeight: 500,
    },
    ratingBox: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '16px',
  },

  ratingLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '6px',
  },

  ratingValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#5664c1',
  },
}