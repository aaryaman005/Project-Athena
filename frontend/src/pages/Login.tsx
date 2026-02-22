import React, { useState, useRef, useEffect } from 'react'
import { Lock, User, AlertCircle, Shield } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import Prism from '../components/Prism'

const Login: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const cardRef = useRef<HTMLDivElement>(null)
    const logoRef = useRef<HTMLDivElement>(null)
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
            // Error shake animation
            gsap.to(cardRef.current, { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: 'power2.inOut' })
        } finally {
            setLoading(false)
        }
    }

    // Animation Effect
    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { scale: 0.95, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.2 }
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
            background: '#020202', // Pure black base
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Layer */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1, // DEFINITELY behind
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

            {/* Content Card */}
            <div
                ref={cardRef}
                className="card"
                style={{
                    width: '440px',
                    padding: '3.5rem',
                    position: 'relative',
                    zIndex: 100, // HIGH z-index
                    background: 'rgba(15, 15, 18, 0.98)', // Significantly more solid
                    backdropFilter: 'blur(50px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 50px 120px rgba(0, 0, 0, 1)',
                    borderRadius: '32px',
                    pointerEvents: 'auto',
                    opacity: 1 // Start visible to avoid CSS confusion
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
                    }}>Project Athena</h1>
                    <p style={{
                        color: 'var(--accent-purple)',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.25em'
                    }}>Autonomous Defense Core</p>
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

                <form ref={formRef} onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 101 }}>
                    <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'rgba(255,255,255,0.7)'
                        }}>Security ID</label>
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
                                    height: '60px',
                                    width: '100%',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter credentials"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '3rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'rgba(255,255,255,0.7)'
                        }}>Access Code</label>
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
                                    height: '60px',
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
                            border: 'none'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Decrypting Access...' : 'Authenticate'}
                    </button>
                </form>

                <div style={{
                    marginTop: '3rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: 600
                }}>
                    <p>Secured by Spartan Audit-Chain v2.4</p>
                </div>
            </div>
        </div>
    )
}

export default Login
