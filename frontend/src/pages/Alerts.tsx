import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Eye, GitBranch } from 'lucide-react'
import { api } from '../api'

interface Alert {
    path_id: string
    path: string[]
    source_node: string
    target_node: string
    privilege_delta: number
    confidence_score: number
    blast_radius: number
    severity: string
    detected_at: string
    recommended_actions: string[]
    auto_response_eligible: boolean
}

function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
    const navigate = useNavigate()

    const fetchAlerts = async () => {
        try {
            const data = await api.getAlerts()
            setAlerts(data.alerts)
        } catch (error) {
            console.error('Failed to fetch alerts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleScan = async () => {
        setLoading(true)
        try {
            await api.scanForAttacks()
            await fetchAlerts()
        } catch (error) {
            console.error('Scan failed:', error)
            setLoading(false)
        }
    }

    const handleViewPath = (alert: Alert) => {
        // Navigate to graph with the attack path as query param
        const pathParam = encodeURIComponent(JSON.stringify(alert.path))
        navigate(`/graph?attackPath=${pathParam}&alertId=${alert.path_id}`)
    }

    useEffect(() => {
        fetchAlerts()
    }, [])

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner" />
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="page-title">Attack Path Alerts</h1>
                        <p className="page-subtitle">Detected privilege escalation paths • {alerts.length} alerts</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={handleScan}>
                            <AlertTriangle size={16} />
                            Run Detection Scan
                        </button>
                        <button className="btn btn-secondary" onClick={fetchAlerts}>
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {alerts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No Alerts Detected</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Run a detection scan to identify privilege escalation attack paths.
                    </p>
                </div>
            ) : (
                <div className="alert-list">
                    {alerts.map((alert) => (
                        <div
                            key={alert.path_id}
                            className="alert-card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setExpandedAlert(expandedAlert === alert.path_id ? null : alert.path_id)}
                        >
                            <div className={`alert-severity ${alert.severity}`} />

                            <div className="alert-info" style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div className="alert-id">{alert.path_id}</div>
                                    <span className={`badge badge-${alert.severity === 'critical' ? 'danger' :
                                            alert.severity === 'high' ? 'warning' :
                                                alert.severity === 'medium' ? 'info' : 'success'
                                        }`}>
                                        {alert.severity.toUpperCase()}
                                    </span>
                                    {alert.auto_response_eligible && (
                                        <span className="badge badge-success">Auto-Eligible</span>
                                    )}
                                </div>
                                <div className="alert-path" style={{ margin: '0.5rem 0' }}>
                                    {alert.source_node} → {alert.target_node}
                                </div>
                                <div className="alert-metrics">
                                    <span>Confidence: {(alert.confidence_score * 100).toFixed(0)}%</span>
                                    <span>Privilege Δ: +{alert.privilege_delta}</span>
                                    <span>Blast Radius: {alert.blast_radius}</span>
                                    <span>Path: {alert.path.length} hops</span>
                                </div>

                                {/* Expanded Details */}
                                {expandedAlert === alert.path_id && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '1rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong style={{ color: 'var(--text-muted)' }}>Attack Path:</strong>
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginTop: '0.5rem'
                                            }}>
                                                {alert.path.map((node, i) => (
                                                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{
                                                            padding: '0.3rem 0.8rem',
                                                            background: i === 0 ? 'rgba(59,130,246,0.2)' :
                                                                i === alert.path.length - 1 ? 'rgba(239,68,68,0.2)' :
                                                                    'rgba(148,163,184,0.2)',
                                                            border: `1px solid ${i === 0 ? '#3b82f6' :
                                                                i === alert.path.length - 1 ? '#ef4444' :
                                                                    '#64748b'}`,
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {node.split(':')[1] || node}
                                                        </span>
                                                        {i < alert.path.length - 1 && (
                                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong style={{ color: 'var(--text-muted)' }}>Recommended Actions:</strong>
                                            <ul style={{ margin: '0.5rem 0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                {alert.recommended_actions.map((action, i) => (
                                                    <li key={i}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <button
                                            className="btn btn-primary"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleViewPath(alert)
                                            }}
                                            style={{ marginTop: '0.5rem' }}
                                        >
                                            <Eye size={16} />
                                            Visualize Attack Path on Graph
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleViewPath(alert)
                                    }}
                                    style={{ padding: '0.5rem 0.75rem' }}
                                    title="View on Graph"
                                >
                                    <GitBranch size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Alerts
