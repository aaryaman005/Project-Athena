import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Network,
    AlertTriangle,
    Shield,
    Activity
} from 'lucide-react'

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Shield size={28} />
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
            </nav>
        </aside>
    )
}

export default Sidebar
