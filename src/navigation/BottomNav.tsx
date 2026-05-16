
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  activeIcon: string;
  requiresAuth?: boolean;
}

export default function BottomNavBar() {
  const location = useLocation();
  const { session } = useAuth();
  
  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Главная',
      icon: 'Г',
      activeIcon: 'Г',
    },
    {
      path: '/chat',
      label: 'Чаты',
      icon: 'Ч',
      activeIcon: 'Ч',
      requiresAuth: true,
    },
    {
      path: '/favorites',
      label: 'Избранное',
      icon: 'И',
      activeIcon: 'И',
      requiresAuth: true,
    },
    {
      path: '/new',
      label: 'Создать',
      icon: 'С',
      activeIcon: 'С',
      requiresAuth: true,
    },
    {
      path: '/settings',
      label: 'Профиль',
      icon: 'П',
      activeIcon: 'П',
      requiresAuth: true,
    },
  ];

  const visibleItems = navItems.filter(item => 
    !item.requiresAuth || session
  );

  if (!session) {
    visibleItems.push({
      path: '/auth',
      label: 'Войти',
      icon: 'Вход',
      activeIcon: 'В',
    });
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon">
              {isActive(item.path) ? item.activeIcon : item.icon}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}