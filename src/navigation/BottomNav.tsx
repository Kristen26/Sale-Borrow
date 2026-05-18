import { Link, useLocation, } from 'react-router-dom'
import { House, MessageCircle, Heart, PlusSquare, User, LogIn,} from 'lucide-react'
import { useAuth } from '../lib/AuthProvider'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  requiresAuth?: boolean
}

export default function BottomNavBar() {
  const location = useLocation()

  const { session } = useAuth()

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Главная',
      icon: <House size={22} />,
    },
    {
      path: '/chat',
      label: 'Чаты',
      icon: <MessageCircle size={22} />,
      requiresAuth: true,
    },
    {
      path: '/favorites',
      label: 'Избранное',
      icon: <Heart size={22} />,
      requiresAuth: true,
    },
    {
      path: '/new',
      label: 'Создать',
      icon: <PlusSquare size={22} />,
      requiresAuth: true,
    },
    {
      path: '/settings',
      label: 'Профиль',
      icon: <User size={22} />,
      requiresAuth: true,
    },
  ]

  const visibleItems = navItems.filter(
    item =>
      !item.requiresAuth || session
  )

  if (!session) {
    visibleItems.push({
      path: '/auth',
      label: 'Войти',
      icon: <LogIn size={22} />,
    })
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {visibleItems.map((item) => (

          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              ...(isActive(item.path)
                ? styles.active
                : {}),
            }}>

            <div style={styles.icon}>
              {item.icon}
            </div>

            <span style={styles.label}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

const styles: Record< string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(255,255,255,0.94)',
    backdropFilter: 'blur(18px)',
    borderTop: '1px solid #ececec',
    zIndex: 1000,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },

  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '72px',
    maxWidth: '700px',
    margin: '0 auto',
  },

  link: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    textDecoration: 'none',
    color: '#8d8d8d',
    transition: '0.2s ease',
    height: '100%',
  },

  active: {
    color: '#5664c1',
  },

  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: '11px',
    fontWeight: 500,
  },
}