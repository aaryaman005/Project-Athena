import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import {
    AlertTriangle,
    Activity,
    RefreshCw,
    Shield,
    Globe,
    Zap,
    Lock
} from 'lucide-react'
import { gsap } from 'gsap'
import { api } from '../api'
import Prism from '../components/Prism'

interface Stats {
    totalNodes: number
    totalEdges: number
    identities: number
    alerts: number
    health: string
    uptime: number
}

interface Alert {
    severity: string
    timestamp: string
    description: string
    source_identity: string
}

function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        totalNodes: 0,
        totalEdges: 0,
        identities: 0,
        alerts: 0,
        health: 'loading',
        uptime: 0
    })
    const [loading, setLoading] = useState(true)
    const [ingesting, setIngesting] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)

    const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
    const [load, setLoad] = useState({ cpu: 42, mem: 68, net: 15 })

    const fetchStats = async () => {
        try {
            const [healthData, graphStats, identitiesData, alertsData] = await Promise.all([
                api.getHealth(),
                api.getGraphStats(),
                api.getIdentities(),
                api.getAlerts()
            ])

            setStats({
                totalNodes: graphStats.total_nodes,
                totalEdges: graphStats.total_edges,
                identities: identitiesData.count,
                alerts: alertsData.count,
                health: healthData.status,
                uptime: healthData.uptime_seconds
            })
            setRecentAlerts((alertsData.alerts || []).slice(0, 8))
        } catch (error) {
            console.error('Failed to fetch stats:', error)
            setStats(prev => ({ ...prev, health: 'offline' }))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadInterval = setInterval(() => {
            setLoad({
                cpu: Math.floor(30 + Math.random() * 20),
                mem: Math.floor(60 + Math.random() * 10),
                net: Math.floor(10 + Math.random() * 30)
            })
        }, 3000)
        return () => clearInterval(loadInterval)
    }, [])

    const handleIngest = async () => {
        setIngesting(true)
        try {
            await api.ingestAWS()
            await fetchStats()
        } catch (error) {
            console.error('Ingest failed:', error)
        } finally {
            setIngesting(false)
        }
    }

    const handleScan = async () => {
        try {
            const result = await api.scanForAttacks()
            alert(`Scan complete: ${result.paths_detected} attack paths detected`)
            await fetchStats()
        } catch (error) {
            console.error('Scan failed:', error)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    useLayoutEffect(() => {
        if (!loading && containerRef.current) {
            const ctx = gsap.context(() => {
                const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1 } })

                tl.from(headerRef.current, { y: -30, opacity: 0 })
                    .from('.stat-card', {
                        y: 40,
                        opacity: 0,
                        stagger: 0.1,
                        duration: 0.8
                    }, '-=0.5')
                    .from('.dashboard-grid > div', {
                        y: 20,
                        opacity: 0,
                        stagger: 0.15
                    }, '-=0.4')
            }, containerRef)
            return () => ctx.revert()
        }
    }, [loading])

    if (loading) {
        return (
            <div className="loading" style={{ height: '80vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="page" ref={containerRef} style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
            {/* High-end Prism Background - Fixed layer */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                opacity: 0.3,
                pointerEvents: 'none',
                overflow: 'hidden'
            }}>
                <Prism
                    animationType="rotate"
                    timeScale={0.2}
                    scale={5}
                    glow={1.0}
                    noise={0.1}
                />
            </div>

            {/* Content Layer (Above Background) */}
            <div style={{ position: 'relative', zIndex: 1, paddingBottom: '4rem' }}>
                {/* Minimal Header */}
                <div className="page-header" ref={headerRef} style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{
                                    background: 'var(--accent-purple)',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 0 20px rgba(82, 39, 255, 0.4)'
                                }}>
                                    <Shield size={20} color="white" />
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em',
                                    color: 'var(--accent-purple)'
                                }}>Command Center</span>
                            </div>
                            <h1 className="page-title" style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', margin: 0 }}>System Overview</h1>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {/* Telemetry Minimal */}
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginRight: '1rem', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
                                {['CPU', 'MEM', 'NET'].map((label, idx) => (
                                    <div key={label} style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {Object.values(load)[idx]}%
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Action Center - MOVED HERE FOR VISIBILITY */}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={handleIngest}
                                    disabled={ingesting}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        background: 'rgba(82, 39, 255, 0.15)',
                                        border: '1px solid rgba(82, 39, 255, 0.4)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover-bright"
                                >
                                    <RefreshCw size={14} className={ingesting ? 'spinning' : ''} />
                                    {ingesting ? 'INGESTING...' : 'INGEST DATA'}
                                </button>

                                <button
                                    onClick={handleScan}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        background: 'rgba(251, 191, 36, 0.15)',
                                        border: '1px solid rgba(251, 191, 36, 0.4)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                    className="hover-bright"
                                >
                                    <Zap size={14} color="#fbbf24" />
                                    SCAN
                                </button>
                            </div>

                            <div className="status-indicator" style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border-color)',
                                padding: '0.5rem 1rem',
                                borderRadius: '100px',
                                marginLeft: '1rem'
                            }}>
                                <span className="status-dot" style={{
                                    width: '8px',
                                    height: '8px',
                                    background: stats.health === 'healthy' ? 'var(--accent-green)' : 'var(--accent-red)',
                                    boxShadow: stats.health === 'healthy' ? '0 0 10px var(--accent-green)' : '0 0 10px var(--accent-red)'
                                }} />
                                <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                    {stats.health === 'healthy' ? 'OPERATIONAL' : 'CRITICAL'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stat Grid */}
                <div className="stats-grid" style={{ marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="stat-card">
                        <div className="stat-label">
                            <Globe size={12} style={{ marginRight: '0.5rem' }} />
                            Nodes
                        </div>
                        <div className="stat-value info" style={{ fontSize: '2rem' }}>{stats.totalNodes}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">
                            <Activity size={12} style={{ marginRight: '0.5rem' }} />
                            Edges
                        </div>
                        <div className="stat-value" style={{ fontSize: '2rem' }}>{stats.totalEdges}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">
                            <Lock size={12} style={{ marginRight: '0.5rem' }} />
                            Identities
                        </div>
                        <div className="stat-value success" style={{ fontSize: '2rem' }}>{stats.identities}</div>
                    </div>

                    <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-red)' }}>
                        <div className="stat-label" style={{ color: 'var(--accent-red)' }}>
                            <AlertTriangle size={12} style={{ marginRight: '0.5rem' }} />
                            Alerts
                        </div>
                        <div className="stat-value critical" style={{ fontSize: '2rem' }}>{stats.alerts}</div>
                    </div>
                </div>

                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr', gap: '2rem' }}>
                    {/* Live Intelligence Feed */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', opacity: 1 }}>
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="card-title">Intelligence Feed</h3>
                            <Activity size={18} color="var(--accent-purple)" />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentAlerts.length > 0 ? recentAlerts.map((alert, idx) => (
                                <div key={idx} style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.85rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 700, color: alert.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
                                            {alert.severity.toUpperCase()}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{alert.timestamp}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{alert.description}</div>
                                    <code style={{ fontSize: '0.7rem', color: 'var(--accent-purple)' }}>{alert.source_identity}</code>
                                </div>
                            )) : (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No active threats detected.</div>
                            )}
                        </div>
                    </div>

                    {/* Operational Overview */}
                    <div className="card" style={{ opacity: 1 }}>
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="card-title">Security Protocols</h3>
                            <Shield size={18} color="var(--accent-purple)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ padding: '1.25rem', background: 'rgba(82, 39, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(82, 39, 255, 0.2)' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <Shield size={16} color="var(--accent-purple)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>Spartan Defense Active</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
                                    Automated response protocols are active. Critical threats will be mitigated autonomously based on confidence thresholds.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Telemetry Stream</div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {['Auth Success', 'API Traffic', 'Detection Rate'].map(l => (
                                        <div key={l} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{l}</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>99.9%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure */}
                    <div className="card">
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="card-title">Infrastructure</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Version</span>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>v2.4.0 SPARTAN</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Uptime</span>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{Math.floor(stats.uptime / 60)}m {stats.uptime % 60}s</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Node Count</span>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{stats.totalNodes} Active</span>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>API Endpoint</div>
                                <code style={{
                                    display: 'block',
                                    padding: '0.75rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: 'var(--accent-purple)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    athena-core.internal:5000
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
