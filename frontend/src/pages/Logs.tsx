import React, { useEffect, useState } from 'react'
import {
    Clock,
    User,
    Activity,
    Search,
    Download,
    ChevronDown,
    ChevronRight,
    Terminal,
    Info,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react'
import { api } from '../api'

interface AuditLog {
    id: string
    timestamp: string
    action: string
    actor: string
    target: string | null
    status: string
    details: string | null
}

function Logs() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('all')
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

    const fetchLogs = async () => {
        try {
            const data = await api.getAuditLogs()
            // Sort by timestamp descending
            const sortedLogs = data.logs.sort((a: any, b: any) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
            setLogs(sortedLogs)
        } catch (error) {
            console.error('Failed to fetch logs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
        const interval = setInterval(fetchLogs, 10000)
        return () => clearInterval(interval)
    }, [])

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedLogs)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedLogs(newExpanded)
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesFilter = filter === 'all' ||
            (filter === 'automated' && log.actor.includes('system')) ||
            (filter === 'manual' && !log.actor.includes('system')) ||
            log.status === filter

        return matchesSearch && matchesFilter
    })

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
            case 'approved':
                return {
                    bg: 'rgba(34, 197, 94, 0.1)',
                    color: 'rgb(34, 197, 94)',
                    icon: <CheckCircle size={14} />
                }
            case 'failed':
            case 'rejected':
                return {
                    bg: 'rgba(239, 68, 68, 0.1)',
                    color: 'rgb(239, 68, 68)',
                    icon: <XCircle size={14} />
                }
            case 'pending':
                return {
                    bg: 'rgba(245, 158, 11, 0.1)',
                    color: 'rgb(245, 158, 11)',
                    icon: <Clock size={14} />
                }
            default:
                return {
                    bg: 'rgba(100, 116, 139, 0.1)',
                    color: 'rgb(100, 116, 139)',
                    icon: <Info size={14} />
                }
        }
    }

    if (loading) {
        return (
            <div className="loading" style={{ height: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="page" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Audit & Governance</h1>
                    <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Immutable ledger of all autonomous responses and administrative actions
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={fetchLogs} style={{ height: '40px' }}>
                        <Activity size={16} />
                        Refresh
                    </button>
                    <button className="btn btn-primary" onClick={() => {
                        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `athena-audit-logs-${new Date().toISOString()}.json`
                        a.click()
                    }} style={{ height: '40px' }}>
                        <Download size={16} />
                        Export Data
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }} />
                        <input
                            type="text"
                            placeholder="Filter logs by action, actor, or target identity..."
                            className="input"
                            style={{ paddingLeft: '40px', width: '100%', height: '45px', background: 'rgba(15, 23, 42, 0.3)', color: '#fff' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Filter:</span>
                        <select
                            className="input"
                            style={{ width: '180px', height: '45px', background: 'rgba(15, 23, 42, 0.3)', color: '#fff' }}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">All Events</option>
                            <option value="automated">Automated Only</option>
                            <option value="manual">Manual Only</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <table className="table" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ width: '40px' }}></th>
                            <th style={{ padding: '1rem' }}>Timestamp</th>
                            <th>Event Action</th>
                            <th>Principal Actor</th>
                            <th>Target Resource</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map(log => {
                                const isExpanded = expandedLogs.has(log.id)
                                const status = getStatusStyles(log.status)
                                const isSystem = log.actor.includes('system')

                                return (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            onClick={() => toggleExpand(log.id)}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                                background: isExpanded ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                                            }}
                                            className="log-row"
                                        >
                                            <td style={{ textAlign: 'center' }}>
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 500 }}>{new Date(log.timestamp).toLocaleDateString()}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: isSystem ? 'var(--accent-blue)' : 'var(--accent-purple)'
                                                    }} />
                                                    <span style={{ fontWeight: 600, letterSpacing: '0.02em', fontSize: '0.9rem' }}>
                                                        {log.action.toUpperCase().replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {isSystem ? <Terminal size={14} color="var(--accent-blue)" /> : <User size={14} color="var(--text-secondary)" />}
                                                    <span style={{ color: isSystem ? 'var(--accent-blue)' : 'inherit', fontWeight: isSystem ? 500 : 400 }}>
                                                        {log.actor}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {log.target ? (
                                                    <code style={{
                                                        padding: '0.2rem 0.4rem',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        {log.target}
                                                    </code>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '99px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    background: status.bg,
                                                    color: status.color,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {status.icon}
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                                                <td colSpan={6} style={{ padding: '1.5rem' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '2rem' }}>
                                                        <div>
                                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Event Summary</h4>
                                                            <p style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{log.details || 'No detailed message provided for this event.'}</p>
                                                        </div>
                                                        <div>
                                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Strict Attributes</h4>
                                                            <div style={{
                                                                background: '#0a0f1d',
                                                                padding: '1rem',
                                                                borderRadius: '0.5rem',
                                                                fontSize: '0.85rem',
                                                                fontFamily: 'monospace',
                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                color: '#94a3b8'
                                                            }}>
                                                                <div style={{ color: '#60a5fa' }}>{'{'}</div>
                                                                <div style={{ paddingLeft: '1.5rem' }}>
                                                                    "event_id": <span style={{ color: '#fbbf24' }}>"{log.id}"</span>,<br />
                                                                    "timestamp": <span style={{ color: '#fbbf24' }}>"{log.timestamp}"</span>,<br />
                                                                    "principal": <span style={{ color: '#fbbf24' }}>"{log.actor}"</span>,<br />
                                                                    "action": <span style={{ color: '#fbbf24' }}>"{log.action}"</span>,<br />
                                                                    "target_arn": <span style={{ color: '#fbbf24' }}>"{log.target || 'null'}"</span>,<br />
                                                                    "status": <span style={{ color: '#fbbf24' }}>"{log.status}"</span>
                                                                </div>
                                                                <div style={{ color: '#60a5fa' }}>{'}'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ opacity: 0.15, marginBottom: '1.5rem' }}>
                                        <AlertTriangle size={64} style={{ margin: '0 auto' }} />
                                    </div>
                                    <p style={{ fontSize: '1.1rem' }}>No matching audit records found in the ledger.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <div>Showing {filteredLogs.length} of {logs.length} indexed events</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }} />
                        Autonomous System
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
                        Human Analyst
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Logs
