import React, { useState, useRef, useEffect } from 'react'
import { Lock, User, AlertCircle, Shield } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { gsap } from 'gsap'

const Login: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const cardRef = useRef<HTMLDivElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const data = await api.login(username, password)
            const userData = {
                username,
                role: username === 'admin' ? 'admin' : 'analyst'
            }
            login(data.access_token, userData)
            navigate('/')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
            gsap.to(cardRef.current, { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: 'power2.inOut' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
            )
        }
    }, [])

    return (
        <div className="login-page" style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0b', // Deep slate/black
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle background gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 70%)',
                zIndex: 1
            }}></div>

            <div
                ref={cardRef}
                style={{
                    width: '400px',
                    padding: '3rem',
                    position: 'relative',
                    zIndex: 10,
                    background: '#161618',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    borderRadius: '8px',
                    pointerEvents: 'auto'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.25rem',
                        color: 'var(--accent-primary)'
                    }}>
                        <Shield size={32} />
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        color: 'white',
                        letterSpacing: '-0.02em'
                    }}>Project Athena</h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>Security Management Console</p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.875rem',
                        borderRadius: '6px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        color: 'var(--accent-red)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.85rem'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form ref={formRef} onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)'
                        }}>USERNAME</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }} />
                            <input
                                type="text"
                                style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '0 1rem 0 2.5rem',
                                    height: '48px',
                                    width: '100%',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Security Identifier"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)'
                        }}>PASSWORD</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }} />
                            <input
                                type="password"
                                style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '0 1rem 0 2.5rem',
                                    height: '48px',
                                    width: '100%',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            height: '48px',
                            borderRadius: '6px',
                            background: 'var(--accent-primary)',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: 'white',
                            border: 'none',
                            transition: 'opacity 0.2s'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                }}>
                    <p style={{ marginBottom: '0.75rem' }}>
                        No account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Create an ID</Link>
                    </p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Authorized Access Only</p>
                </div>
            </div>
        </div>
    )
}

export default Login
