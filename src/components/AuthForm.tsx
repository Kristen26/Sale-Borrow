import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp, signIn } from '../lib/auth'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password)

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    if (isLogin) {
      navigate('/', { replace: true }) // ✅ редирект
    } else {
      alert('Проверьте почту для подтверждения')
    }

    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          {isLogin ? 'Вход' : 'Регистрация'}
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={styles.error}>
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading
              ? 'Загрузка...'
              : isLogin
              ? 'Войти'
              : 'Создать аккаунт'}
          </button>
        </form>

        {/* Switch */}
        <div style={styles.switch}>
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <span
            onClick={() => {
              setIsLogin(!isLogin)
              setErrorMsg('')
            }}
            style={styles.link}
          >
            {isLogin ? ' Зарегистрироваться' : ' Войти'}
          </span>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F5F5F5',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  card: {
    width: '100%',
    maxWidth: '360px',
    background: '#fff',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  },

  title: {
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '24px',
    color: '#111',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  label: {
    fontSize: '13px',
    color: '#666',
  },

  input: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    fontSize: '15px',
    outline: 'none',
    transition: '0.2s',
  },

  button: {
    marginTop: '8px',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },

  error: {
    background: '#FFF0F0',
    color: '#D32F2F',
    padding: '10px',
    borderRadius: '10px',
    fontSize: '13px',
  },

  switch: {
    marginTop: '18px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#777',
  },

  link: {
    color: '#000',
    fontWeight: 500,
    cursor: 'pointer',
  },
}