import React, { useState, useEffect } from 'react'
import { Users, Shield, Trash2, UserPlus, ShieldCheck, ShieldAlert, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../api'

interface UserRecord {
    username: string
    role: string
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [error, setError] = useState('')

    const fetchUsers = async () => {
        try {
            const data = await api.listUsers()
            setUsers(data.users)
            setError('')
        } catch (err: any) {
            setError('Failed to retrieve intelligence assets (Users). Permission denied or network error.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleRoleChange = async (username: string, newRole: string) => {
        setActionLoading(username)
        try {
            await api.updateUserRole(username, newRole)
            await fetchUsers()
        } catch (err) {
            setError('Elevation/Demotion failed. Security protocols blocked the change.')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeleteUser = async (username: string) => {
        if (!window.confirm(`Are you sure you want to revoke access for agent ${username}?`)) return

        setActionLoading(username)
        try {
            await api.deleteUser(username)
            await fetchUsers()
        } catch (err) {
            setError('Revocation failed. Asset protected by system core.')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="page-loading">
                <Loader2 className="animate-spin" size={40} color="var(--accent-purple)" />
                <p>Decoding User Registry...</p>
            </div>
        )
    }

    return (
        <div className="page user-management" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div className="page-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3rem'
            }}>
                <div>
                    <h1 className="text-glow">User Registry</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                        Manage authorized security assets and clearance levels
                    </p>
                </div>
                <Users size={32} color="var(--accent-purple)" />
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    color: 'var(--accent-red)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '2rem'
                }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <tr>
                            <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Identity Handle</th>
                            <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Clearance Tier</th>
                            <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Protocols</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.username} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: u.role === 'admin' ? 'rgba(82, 39, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: u.role === 'admin' ? 'var(--accent-purple)' : 'white'
                                        }}>
                                            {u.role === 'admin' ? <ShieldCheck size={20} /> : <Shield size={20} />}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{u.username}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <span style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        background: u.role === 'admin' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        {u.role === 'admin' ? (
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => handleRoleChange(u.username, 'analyst')}
                                                disabled={actionLoading !== null || u.username === 'admin'}
                                                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}
                                            >
                                                Demote
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleRoleChange(u.username, 'admin')}
                                                disabled={actionLoading !== null}
                                            >
                                                Elevate
                                            </button>
                                        )}

                                        <button
                                            className="btn btn-sm"
                                            onClick={() => handleDeleteUser(u.username)}
                                            style={{ color: 'var(--accent-red)', border: '1px solid rgba(244, 63, 94, 0.2)', background: 'transparent' }}
                                            disabled={actionLoading !== null || u.username === 'admin'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                <ShieldAlert size={14} />
                <p>Note: Administrative actions are logged in the Secure Audit Trail.</p>
            </div>
        </div>
    )
}

export default UserManagement
