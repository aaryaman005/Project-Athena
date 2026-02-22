import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Network,
    AlertTriangle,
    Activity,
    ClipboardList,
    LogOut,
    User as UserIcon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="Athena Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <span>Athena</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={20} />
                    Dashboard
                </NavLink>

                <NavLink
                    to="/graph"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Network size={20} />
                    Identity Graph
                </NavLink>

                <NavLink
                    to="/alerts"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <AlertTriangle size={20} />
                    Alerts
                </NavLink>

                <NavLink
                    to="/response"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Activity size={20} />
                    Response
                </NavLink>

                <NavLink
                    to="/logs"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <ClipboardList size={20} />
                    Audit Logs
                </NavLink>
            </nav>

            <div className="sidebar-footer" style={{
                marginTop: 'auto',
                padding: '1rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <UserIcon size={16} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.username || 'Analyst'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            {user?.role || 'User'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'var(--accent-red)' }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
