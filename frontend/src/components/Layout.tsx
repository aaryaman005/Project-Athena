import { ReactNode } from 'react'
import StaggeredMenu from './StaggeredMenu'

interface LayoutProps {
    children: ReactNode
}

const menuItems = [
    { label: 'Dashboard', ariaLabel: 'Security overview', link: '/' },
    { label: 'Graph Explorer', ariaLabel: 'Identity and attack path graph', link: '/graph' },
    { label: 'Attack Alerts', ariaLabel: 'View detected threats', link: '/alerts' },
    { label: 'SOAR Actions', ariaLabel: 'Manage response plans', link: '/response' },
    { label: 'Audit Logs', ariaLabel: 'System activity history', link: '/logs' }
]

const socialItems = [
    { label: 'System Health', link: '/health' },
    { label: 'Documentation', link: '/docs' },
    { label: 'GitHub', link: 'https://github.com/project-athena' }
]

function Layout({ children }: LayoutProps) {
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
