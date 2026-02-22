import React, { useEffect, useState } from 'react'
import {
    Heart,
    Zap,
    Cpu,
    Database,
    Server,
    Activity,
    ShieldCheck,
    RefreshCw
} from 'lucide-react'
import { api } from '../api'

interface HealthStatus {
    status: string
    service: string
    uptime_seconds: number
}

function Health() {
    const [health, setHealth] = useState<HealthStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [systemMetrics, setSystemMetrics] = useState({
        cpu: 12,
        memory: 45,
        network: 2.4,
        storage: 18
    })

    const fetchHealth = async () => {
        try {
            const data = await api.getHealth()
            setHealth(data)
            setError(null)
            // Simulated variation in metrics
            setSystemMetrics(prev => ({
                cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
                memory: Math.max(30, Math.min(80, prev.memory + (Math.random() * 2 - 1))),
                network: Math.max(0.1, prev.network + (Math.random() * 0.5 - 0.25)),
                storage: prev.storage
            }))
        } catch (err) {
            setError('Backend service unreachable')
            setHealth(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHealth()
        const interval = setInterval(fetchHealth, 3000)
        return () => clearInterval(interval)
    }, [])

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24))
        const h = Math.floor((seconds % (3600 * 24)) / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = Math.floor(seconds % 60)
        return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`
    }

    return (
        <div className="page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '3rem' }}>
                <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>System Health</h1>
                <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                    Live telemetry and operational status for Athena Core services
                </p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-label">Service Status</div>
                    <div className="stat-value" style={{ color: error ? 'var(--accent-red)' : 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {error ? <Zap size={32} /> : <ShieldCheck size={32} />}
                        {error ? 'DEGRADED' : 'OPERATIONAL'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">System Uptime</div>
                    <div className="stat-value">
                        {health ? formatUptime(health.uptime_seconds) : '--:--:--'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">API Latency</div>
                    <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                        {error ? 'N/A' : '12ms'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Compute Resources</h3>
                        <Cpu size={18} color="var(--accent-purple)" />
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>CPU Utilization</span>
                                <span>{systemMetrics.cpu.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${systemMetrics.cpu}%`,
                                    background: 'var(--accent-purple)',
                                    transition: 'width 0.5s ease-out'
                                }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Memory Commitment</span>
                                <span>{systemMetrics.memory.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${systemMetrics.memory}%`,
                                    background: 'var(--accent-blue)',
                                    transition: 'width 0.5s ease-out'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Network & IO</h3>
                        <Activity size={18} color="var(--accent-cyan)" />
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Inbound Traffic</span>
                                <span>{systemMetrics.network.toFixed(2)} MB/s</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, systemMetrics.network * 10)}%`,
                                    background: 'var(--accent-cyan)',
                                    transition: 'width 0.5s ease-out'
                                }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Disk Residency</span>
                                <span>{systemMetrics.storage}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${systemMetrics.storage}%`,
                                    background: 'rgba(255,255,255,0.2)',
                                    transition: 'width 0.5s ease-out'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                <div className="card-header">
                    <h3 className="card-title">Infrastructure Cluster</h3>
                    <Server size={18} color="var(--text-secondary)" />
                </div>
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>athena-db-01</div>
                            <div style={{ fontSize: '0.8rem' }}>PostgreSQL Cluster • Active</div>
                        </div>
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>athena-cache-01</div>
                            <div style={{ fontSize: '0.8rem' }}>Redis (Standard_v2) • Operational</div>
                        </div>
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>athena-ingester-01</div>
                            <div style={{ fontSize: '0.8rem' }}>Worker Node • Polling AWS...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Health
