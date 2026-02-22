import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
    username: string
    role: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, userData: User) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('athena_user')
        return savedUser ? JSON.parse(savedUser) : null
    })
    const [token, setToken] = useState<string | null>(() => {
        const savedToken = localStorage.getItem('athena_token')
        if (savedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
            return savedToken
        }
        return null
    })

    useEffect(() => {
        // Token is already set in useState initialization, 
        // but we double check if localStorage changes in other tabs?
        // For simplicity, we stick to the initial sync state.
    }, [])

    const login = (token: string, userData: User) => {
        setToken(token)
        setUser(userData)
        localStorage.setItem('athena_token', token)
        localStorage.setItem('athena_user', JSON.stringify(userData))
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('athena_token')
        localStorage.removeItem('athena_user')
        delete axios.defaults.headers.common['Authorization']
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
