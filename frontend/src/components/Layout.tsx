import { ReactNode } from 'react'
import StaggeredMenu from './StaggeredMenu'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
    children: ReactNode
}

interface LayoutMenuItem {
    label: string
    ariaLabel: string
    link?: string
    onClick?: () => void
}

function Layout({ children }: LayoutProps) {
    const { user, logout } = useAuth()

    const menuItems: LayoutMenuItem[] = [
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

    // Add Logout at the end
    menuItems.push({
        label: 'Logout',
        ariaLabel: 'Sign out of Athena',
        onClick: () => {
            if (window.confirm('Are you sure you want to sign out?')) {
                logout()
            }
        }
    })

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
                    accentColor="#3B82F6"
                    colors={['#1a1b1e', '#2c2e33', '#3B82F6']}
                />
                {children}
            </main>
        </div>
    )
}

export default Layout
