
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
      icon: '🏠',
      activeIcon: '🏠',
    },
    {
      path: '/chat',
      label: 'Чаты',
      icon: '💬',
      activeIcon: '💬',
      requiresAuth: true,
    },
    {
      path: '/favorites',
      label: 'Избранное',
      icon: '❤️',
      activeIcon: '❤️',
      requiresAuth: true,
    },
    {
      path: '/new',
      label: 'Создать',
      icon: '➕',
      activeIcon: '➕',
      requiresAuth: true,
    },
    {
      path: '/settings',
      label: 'Профиль',
      icon: '👤',
      activeIcon: '👤',
      requiresAuth: true,
    },
  ];

  // Фильтруем пункты в зависимости от авторизации
  const visibleItems = navItems.filter(item => 
    !item.requiresAuth || session
  );

  // Если пользователь не авторизован, добавляем кнопку "Войти"
  if (!session) {
    visibleItems.push({
      path: '/auth',
      label: 'Войти',
      icon: '🔑',
      activeIcon: '🔑',
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