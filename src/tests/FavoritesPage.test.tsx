import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import ItemCard from '../components/ItemCard'
import type { Tables } from '../types/database.types'

vi.mock('../lib/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1' } },
  }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

const isFavoriteMock = vi.fn().mockResolvedValue(false)
const toggleFavoriteMock = vi.fn().mockResolvedValue(true)

vi.mock('../lib/favorites', () => ({
  isFavorite: (...args: unknown[]) => isFavoriteMock(...args),
  toggleFavorite: (...args: unknown[]) => toggleFavoriteMock(...args),
}))

//Тест для проверки корректного добавления в избранное
describe('ItemCard', () => {
  test('click "heart" calls toggleFavorite', async () => {
    const item: Tables<'items'> = {
      id: '1',
      title: 'Sofa',
      description: null,
      price: 1000,
      deal_type: 'sale',
      image_urls: [],
      is_active: true,
      owner_id: 'test-owner',
      building_id: 'test-building',
      created_at: '2024-01-01',
    }

    render(<ItemCard item={item} />)

    const button = screen.getByRole('button')

    fireEvent.click(button)

    expect(toggleFavoriteMock).toHaveBeenCalledWith(
      'user-1',
      '1'
    )
  })
})