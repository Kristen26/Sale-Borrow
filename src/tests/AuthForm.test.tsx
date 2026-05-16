import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

import AuthForm from '../components/AuthForm'


// Тест для проверки изменения состояния isLogin между "Вход" и "Регистрация"
describe('AuthForm', () => {

    test('switches between login and register', () => {

    render(
        <MemoryRouter>
            <AuthForm />
        </MemoryRouter>
    )

    expect(
        screen.getByText('Вход')
    ).toBeInTheDocument()

    fireEvent.click(
        screen.getByText(/Зарегистрироваться/i)
    )

    expect(
        screen.getByText('Регистрация')
    ).toBeInTheDocument()
    })
})