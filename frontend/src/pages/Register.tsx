import React, { useState, useRef, useEffect } from 'react'
import { Lock, User, AlertCircle, Shield, ArrowLeft } from 'lucide-react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import { gsap } from 'gsap'


const Register: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    const cardRef = useRef<HTMLDivElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            await api.register(username, password)
            setSuccess('Registration successful! Redirecting to login...')
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err: any) {
            const detail = err?.response?.data?.detail
            if (Array.isArray(detail)) {
                const message = detail
                    .map((item: any) => item?.msg)
                    .filter(Boolean)
                    .join(' | ')
                setError(message || 'Registration failed. Please check your input.')
            } else if (typeof detail === 'string') {
                setError(detail)
            } else {
                setError('Registration failed. Please try a different username.')
            }
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
        <div className="register-page" style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0b',
            position: 'relative',
            overflow: 'hidden'
        }}>
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
                    }}>Join Athena</h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>Create Agent Credentials</p>
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

                {success && (
                    <div style={{
                        padding: '0.875rem',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: 'rgb(16, 185, 129)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.85rem'
                    }}>
                        <Shield size={16} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)'
                        }}>AGENT HANDLE</label>
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
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose ID"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)'
                        }}>SECURE CODE</label>
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
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
                        }}>VERIFY CODE</label>
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
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat Code"
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
                            marginBottom: '1.25rem',
                            transition: 'opacity 0.2s'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Initializing Agent...' : 'Join Platform'}
                    </button>

                    <Link to="/login" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'color 0.2s'
                    }}>
                        <ArrowLeft size={14} />
                        Return to Authentication
                    </Link>
                </form>
            </div>
        </div>
    )
}

export default Register
