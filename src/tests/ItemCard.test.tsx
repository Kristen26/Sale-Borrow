import { describe, test, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ItemCard from '../components/ItemCard'

vi.mock('../lib/AuthProvider', () => ({
    useAuth: () => ({
        session: null,
    }),
}))

describe('ItemCard', () => {
    //Тест для проверки того, корректно ли компонент ItemCard отобржает название товара
    test('renders item title', () => {

    const item = {
        id: '1',
        title: 'iPhone',
        description: 'Test description',
        price: 1000,
        deal_type: 'sale' as const,
        image_urls: [],
        is_active: true,
        owner_id: 'test-user',
        building_id: 'test-building',
        created_at: '2026-01-01',
    }

    render(
        <MemoryRouter>
            <ItemCard item={item} />
        </MemoryRouter>
    )

    expect(
        screen.getByText('iPhone')
    ).toBeInTheDocument()

    })


    //Тест для проверки показывается ли цена внутри карточки товара
    test('Renders item price', () => {
        const item = {
            id: '1',
            title: 'TV',
            description: 'Test description',
            price: 10000,
            deal_type: 'sale' as const,
            image_urls: [],
            is_active: true,
            owner_id: 'test-user',
            building_id: 'test-building',
            created_at: '2026-01-01',
        }

        render(
            <MemoryRouter>
                <ItemCard item={item}/>
            </MemoryRouter>
        )

        expect(
            screen.getByText('10000 ₽')
        ).toBeInTheDocument()
    })

    test('Shows placeholder when image is missing', () => {
        const item = {
            id: '1',
            title: 'TV',
            description: 'Test description',
            price: 10000,
            deal_type: 'sale' as const,
            image_urls: [],
            is_active: true,
            owner_id: 'test-user',
            building_id: 'test-building',
            created_at: '2026-01-01',
        }

        render(
            <MemoryRouter>
                <ItemCard item={item}/>
            </MemoryRouter>
        )

        expect(
            screen.getByText(/нет фото/i)
        ).toBeInTheDocument()
    })
})