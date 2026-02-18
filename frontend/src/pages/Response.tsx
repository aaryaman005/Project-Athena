import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../api'
import { ToastContainer, Toast } from '../components/Toast'

interface ResponseAction {
    action_id: string
    action_type: string
    target: string
    status: string
    executed_at: string | null
    result: string | null
    reversible: boolean
}

interface ResponsePlan {
    plan_id: string
    alert_id: string
    actions: ResponseAction[]
    auto_approved: boolean
    human_approved: boolean
    created_at: string
}

function Response() {
    const [pending, setPending] = useState<ResponsePlan[]>([])
    const [history, setHistory] = useState<ResponsePlan[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (message: string, type: Toast['type']) => {
        const id = Math.random().toString(36).substring(7)
        setToasts(prev => [...prev, { id, message, type }])
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    const fetchData = async () => {
        try {
            const [pendingData, historyData] = await Promise.all([
                api.getPendingResponses(),
                api.getResponseHistory()
            ])
            setPending(pendingData.pending)
            setHistory(historyData.history)
        } catch (error) {
            console.error('Failed to fetch response data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (planId: string) => {
        try {
            await api.approveResponse(planId)
            addToast(`Response plan ${planId.substring(0, 8)} approved and executing`, 'success')
            await fetchData()
        } catch (error) {
            console.error('Approval failed:', error)
            addToast('Failed to approve response plan', 'error')
        }
    }

    const handleReject = async (planId: string) => {
        try {
            await api.rejectResponse(planId)
            addToast(`Response plan ${planId.substring(0, 8)} rejected`, 'warning')
            await fetchData()
        } catch (error) {
            console.error('Rejection failed:', error)
            addToast('Failed to reject response plan', 'error')
        }
    }

    const handleExecute = async (planId: string) => {
        try {
            const result = await api.executeResponse(planId)
            addToast(`Executed ${result.executed} actions successfully`, 'success')
            await fetchData()
        } catch (error) {
            console.error('Execution failed:', error)
            addToast('Response execution failed', 'error')
        }
    }

    const handleRollback = async (actionId: string) => {
        try {
            await api.rollbackAction(actionId)
            addToast('Action rolled back successfully', 'info')
            await fetchData()
        } catch (error) {
            console.error('Rollback failed:', error)
            addToast('Rollback failed', 'error')
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000) // 30s refresh
        return () => clearInterval(interval)
    }, [])

    const totalActions = history.reduce((acc, plan) => acc + plan.actions.length, 0)
    const autoApprovedCount = history.filter(p => p.auto_approved).length
    const automationRate = history.length > 0 ? ((autoApprovedCount / history.length) * 100).toFixed(0) : '0'

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner" />
                </div>
            </div>
        )
    }

    const selectedPlanData = [...pending, ...history].find(p => p.plan_id === selectedPlan)

    return (
        <>
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <div className="page">
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 className="page-title">Response Management</h1>
                            <p className="page-subtitle">Automated response plans and execution history</p>
                        </div>
                        <button className="btn btn-secondary" onClick={fetchData}>
                            <RefreshCw size={14} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="summary-bar">
                    <div className="summary-item">
                        <span className="summary-label">Pending</span>
                        <span className="summary-value">{pending.length}</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-item">
                        <span className="summary-label">Executed</span>
                        <span className="summary-value">{history.length}</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-item">
                        <span className="summary-label">Total Actions</span>
                        <span className="summary-value">{totalActions}</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-item">
                        <span className="summary-label">Automation Rate</span>
                        <span className="summary-value">{automationRate}%</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: selectedPlan ? '1fr 400px' : '1fr', gap: '1rem' }}>
                    <div>
                        {/* Pending Approvals */}
                        {pending.length > 0 && (
                            <div className="card" style={{ marginBottom: '1rem' }}>
                                <div className="card-header">
                                    <h3 className="card-title">Pending Approvals</h3>
                                    <span className="count-badge">{pending.length}</span>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Plan ID</th>
                                            <th>Alert ID</th>
                                            <th>Actions</th>
                                            <th>Type</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.map((plan) => (
                                            <tr
                                                key={plan.plan_id}
                                                className={selectedPlan === plan.plan_id ? 'selected' : ''}
                                                onClick={() => setSelectedPlan(plan.plan_id)}
                                            >
                                                <td>
                                                    <code>{plan.plan_id}</code>
                                                </td>
                                                <td>
                                                    <code>{plan.alert_id}</code>
                                                </td>
                                                <td>{plan.actions.length}</td>
                                                <td>
                                                    {plan.auto_approved ? (
                                                        <span className="status-badge status-auto">Auto</span>
                                                    ) : (
                                                        <span className="status-badge status-manual">Manual</span>
                                                    )}
                                                </td>
                                                <td>{new Date(plan.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="table-btn table-btn-approve"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleApprove(plan.plan_id)
                                                            }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            className="table-btn table-btn-reject"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleReject(plan.plan_id)
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Execution History */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Execution History</h3>
                                <span className="count-badge">{history.length}</span>
                            </div>
                            {history.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>No execution history</p>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Plan ID</th>
                                            <th>Alert ID</th>
                                            <th>Actions</th>
                                            <th>Type</th>
                                            <th>Executed</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((plan) => (
                                            <tr
                                                key={plan.plan_id}
                                                className={selectedPlan === plan.plan_id ? 'selected' : ''}
                                                onClick={() => setSelectedPlan(plan.plan_id)}
                                            >
                                                <td>
                                                    <code>{plan.plan_id}</code>
                                                </td>
                                                <td>
                                                    <code>{plan.alert_id}</code>
                                                </td>
                                                <td>{plan.actions.length}</td>
                                                <td>
                                                    {plan.auto_approved ? (
                                                        <span className="status-badge status-auto">Auto</span>
                                                    ) : (
                                                        <span className="status-badge status-manual">Manual</span>
                                                    )}
                                                </td>
                                                <td>{new Date(plan.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</td>
                                                <td>
                                                    <button
                                                        className="table-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleExecute(plan.plan_id)
                                                        }}
                                                    >
                                                        Re-run
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Details Panel */}
                    {selectedPlan && selectedPlanData && (
                        <div className="details-panel">
                            <div className="details-header">
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        PLAN DETAILS
                                    </div>
                                    <code style={{ fontSize: '0.875rem' }}>{selectedPlan}</code>
                                </div>
                                <button
                                    className="close-btn"
                                    onClick={() => setSelectedPlan(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="details-section">
                                <div className="details-row">
                                    <span className="details-label">Alert ID</span>
                                    <code>{selectedPlanData.alert_id}</code>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Approval Type</span>
                                    <span className={`status-badge ${selectedPlanData.auto_approved ? 'status-auto' : 'status-manual'}`}>
                                        {selectedPlanData.auto_approved ? 'Automated' : 'Manual'}
                                    </span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Created</span>
                                    <span>{new Date(selectedPlanData.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="details-section">
                                <div className="section-title">ACTIONS ({selectedPlanData.actions.length})</div>
                                <div className="actions-list">
                                    {selectedPlanData.actions.map((action, i) => (
                                        <div key={action.action_id} className="action-item">
                                            <div className="action-header">
                                                <span className="action-number">{i + 1}</span>
                                                <span className="action-type">{action.action_type.replace(/_/g, ' ')}</span>
                                                {action.status === 'completed' && (
                                                    <span className="action-status status-completed">✓</span>
                                                )}
                                                {action.status === 'failed' && (
                                                    <span className="action-status status-failed">✗</span>
                                                )}
                                            </div>
                                            <div className="action-target">
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target:</span>
                                                {' '}
                                                <code style={{ fontSize: '0.75rem' }}>{action.target.split(':').pop()}</code>
                                            </div>
                                            {action.result && (
                                                <div className="action-result">
                                                    {action.result}
                                                </div>
                                            )}
                                            {action.reversible && action.status === 'completed' && (
                                                <button
                                                    className="action-rollback"
                                                    onClick={() => handleRollback(action.action_id)}
                                                >
                                                    Rollback
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Response
