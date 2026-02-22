import { useAuth } from '../context/AuthContext'

interface LayoutProps {
    children: ReactNode
}

function Layout({ children }: LayoutProps) {
    const { user } = useAuth()

    const menuItems = [
        { label: 'Dashboard', ariaLabel: 'Security overview', link: '/' },
        { label: 'Graph Explorer', ariaLabel: 'Identity and attack path graph', link: '/graph' },
        { label: 'Attack Alerts', ariaLabel: 'View detected threats', link: '/alerts' },
        { label: 'SOAR Actions', ariaLabel: 'Manage response plans', link: '/response' },
        { label: 'Audit Logs', ariaLabel: 'System activity history', link: '/logs' }
    ]

    // Only add User Management for admins
    if (user?.role === 'admin') {
        menuItems.push({
            label: 'User Management',
            ariaLabel: 'Manage agents and clearance',
            link: '/admin/users'
        })
    }

    const socialItems = [
        { label: 'System Health', link: '/health' },
        { label: 'Documentation', link: '/docs' },
        { label: 'GitHub', link: 'https://github.com/project-athena' }
    ]

    return (
        <div className="app-layout">
            <main className="main-content" style={{ paddingLeft: 0, paddingTop: '100px', position: 'relative' }}>
                <StaggeredMenu
                    items={menuItems}
                    socialItems={socialItems}
                    displayItemNumbering
                    accentColor="#5227FF"
                    colors={['#1a1b1e', '#2c2e33', '#5227FF']}
                />
                {children}
            </main>
        </div>
    )
}

export default Layout
