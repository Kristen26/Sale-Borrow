import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import HomePage from './pages/HomePage'
import ChatsPage from './pages/ChatsPage'
import ChatPage from './pages/ChatPage'
import NewItemPage from './pages/NewItemPage'
import SettingsPage from './pages/SettingsPage'
import AppLayout from './layouts/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import FavoritesPage from './pages/FavoritesPage'
import CartPage from './pages/CartPage'
import ActiveItemsPage from './pages/ActiveProductPage'
import CompletedItemsPage from './pages/CompProductActivate'
import EditItemPage from './pages/EditItemPage'
import BuyerPage from './pages/BuyerPage'
import ScorePage from './pages/ScorePage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/item/:id" element={<CartPage />} />

        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
            <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<ChatsPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/new" element={<NewItemPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/my/active" element={<ActiveItemsPage />} />
            <Route path="/my/completed" element={<CompletedItemsPage />} />
            <Route path="/edit/:id" element={<EditItemPage />} />
            <Route path="/buyer/:id" element={<BuyerPage />} />
            <Route path="/score/:id" element={<ScorePage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App