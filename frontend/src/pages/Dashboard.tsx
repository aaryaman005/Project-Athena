import { useEffect, useState } from 'react'
import {
    AlertTriangle,
    Activity,
    RefreshCw
} from 'lucide-react'
import { api } from '../api'

interface Stats {
    totalNodes: number
    totalEdges: number
    identities: number
    alerts: number
    health: string
    uptime: number
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
        } catch (error) {
            console.error('Failed to fetch stats:', error)
            setStats(prev => ({ ...prev, health: 'offline' }))
        } finally {
            setLoading(false)
        }
    }

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

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="page-title">Security Dashboard</h1>
                        <p className="page-subtitle">Cloud Identity Attack Path Detection</p>
                    </div>
                    <div className="status-indicator">
                        <span className="status-dot" style={{
                            background: stats.health === 'healthy' ? 'var(--accent-green)' : 'var(--accent-red)'
                        }} />
                        {stats.health === 'healthy' ? 'System Operational' : 'System Offline'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Graph Nodes</div>
                    <div className="stat-value info">{stats.totalNodes}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Graph Edges</div>
                    <div className="stat-value">{stats.totalEdges}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Identities</div>
                    <div className="stat-value success">{stats.identities}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Alerts</div>
                    <div className="stat-value critical">{stats.alerts}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Quick Actions</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleIngest}
                        disabled={ingesting}
                    >
                        <RefreshCw size={16} className={ingesting ? 'spinning' : ''} />
                        {ingesting ? 'Ingesting...' : 'Ingest AWS Data'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleScan}>
                        <AlertTriangle size={16} />
                        Scan for Attack Paths
                    </button>
                    <button className="btn btn-secondary" onClick={fetchStats}>
                        <Activity size={16} />
                        Refresh Stats
                    </button>
                </div>
            </div>

            {/* System Info */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">System Information</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Backend URL:</span>
                        <span style={{ marginLeft: '0.5rem' }}>http://localhost:5000</span>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Uptime:</span>
                        <span style={{ marginLeft: '0.5rem' }}>{Math.floor(stats.uptime / 60)} minutes</span>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>API Docs:</span>
                        <a
                            href="http://localhost:5000/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: '0.5rem', color: 'var(--accent-blue)' }}
                        >
                            OpenAPI Swagger UI
                        </a>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Metrics:</span>
                        <a
                            href="http://localhost:5000/metrics"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: '0.5rem', color: 'var(--accent-blue)' }}
                        >
                            Prometheus Endpoint
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
