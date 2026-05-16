import { Outlet } from 'react-router-dom';
import BottomNavBar from '../navigation/BottomNav';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <main className="content-with-nav">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  );
}