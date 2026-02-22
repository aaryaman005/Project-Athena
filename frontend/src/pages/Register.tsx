import React, { useState, useRef, useEffect } from 'react'
import { Lock, User, AlertCircle, Shield, ArrowLeft } from 'lucide-react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import { gsap } from 'gsap'
import Prism from '../components/Prism'

const Register: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    const cardRef = useRef<HTMLDivElement>(null)
    const logoRef = useRef<HTMLDivElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

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
            setError(err.response?.data?.detail || 'Registration failed. Please try a different username.')
            gsap.to(cardRef.current, { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: 'power2.inOut' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { scale: 0.95, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.2 }
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
            background: '#020202',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                pointerEvents: 'none'
            }}>
                <Prism
                    animationType="rotate"
                    timeScale={0.3}
                    scale={4}
                    glow={1.5}
                    noise={0.1}
                />
            </div>

            <div
                ref={cardRef}
                className="card"
                style={{
                    width: '440px',
                    padding: '3.5rem',
                    position: 'relative',
                    zIndex: 100,
                    background: 'rgba(15, 15, 18, 0.98)',
                    backdropFilter: 'blur(50px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 50px 120px rgba(0, 0, 0, 1)',
                    borderRadius: '32px',
                    opacity: 1
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div ref={logoRef} style={{
                        display: 'inline-flex',
                        background: 'var(--accent-purple)',
                        padding: '1.25rem',
                        borderRadius: '20px',
                        marginBottom: '1.5rem',
                        boxShadow: '0 0 40px rgba(82, 39, 255, 0.5)'
                    }}>
                        <Shield size={44} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '2.8rem',
                        fontWeight: 900,
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.05em',
                        color: 'white'
                    }}>Register</h1>
                    <p style={{
                        color: 'var(--accent-purple)',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.25em'
                    }}>Join the Athena Network</p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: 'var(--accent-red)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '2rem',
                        fontSize: '0.85rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: 'rgb(16, 185, 129)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '2rem',
                        fontSize: '0.85rem'
                    }}>
                        <Shield size={18} />
                        {success}
                    </div>
                )}

                <form ref={formRef} onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 101 }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'rgba(255,255,255,0.7)'
                        }}>Agent Handle</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'rgba(255,255,255,0.5)'
                            }} />
                            <input
                                type="text"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '14px',
                                    padding: '0 1rem 0 3rem',
                                    height: '56px',
                                    width: '100%',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose ID"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'rgba(255,255,255,0.7)'
                        }}>Secure Code</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'rgba(255,255,255,0.5)'
                            }} />
                            <input
                                type="password"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '14px',
                                    padding: '0 1rem 0 3rem',
                                    height: '56px',
                                    width: '100%',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'rgba(255,255,255,0.7)'
                        }}>Verify Code</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'rgba(255,255,255,0.5)'
                            }} />
                            <input
                                type="password"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '14px',
                                    padding: '0 1rem 0 3rem',
                                    height: '56px',
                                    width: '100%',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
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
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            height: '60px',
                            borderRadius: '14px',
                            background: 'var(--accent-purple)',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            boxShadow: '0 15px 40px rgba(82, 39, 255, 0.4)',
                            cursor: 'pointer',
                            color: 'white',
                            border: 'none',
                            marginBottom: '1.5rem'
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
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
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
