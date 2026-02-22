import React from 'react'
import {
    BookOpen,
    Shield,
    Target,
    Zap,
    ArrowRight,
    Users,
    Activity,
    Lock
} from 'lucide-react'

function Docs() {
    return (
        <div className="page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '0.5rem 1rem',
                    background: 'rgba(82, 39, 255, 0.1)',
                    color: 'var(--accent-purple)',
                    borderRadius: '99px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    Knowledge Base
                </div>
                <h1 className="page-title" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Platform Documentation</h1>
                <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto' }}>
                    Project Athena is a cloud-native security platform designed to detect identity-based attack paths in real-time.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <Shield size={32} color="var(--accent-purple)" style={{ marginBottom: '1.5rem' }} />
                    <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Identity-First Security</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        Athena focuses on Cloud Identities (IAM Users, Roles, Services) as the primary perimeter. By mapping the relationship between identities and resources, we identify hidden privilege escalations.
                    </p>
                </div>

                <div className="card">
                    <Target size={32} color="var(--accent-cyan)" style={{ marginBottom: '1.5rem' }} />
                    <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Attack Path Analysis</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        Using graph theory, Athena visualizes how an attacker could move from a low-privilege entry point to a 'Crown Jewel' resource via multi-step permissions jumps.
                    </p>
                </div>

                <div className="card">
                    <Zap size={32} color="var(--accent-yellow)" style={{ marginBottom: '1.5rem' }} />
                    <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Autonomous Response</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        When a high-confidence attack path is detected, Athena generates SOAR playbooks to automatically rotate keys, isolate roles, or notify security teams.
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '4rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>Core Concepts</h2>

                <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '2rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                            <Users size={18} color="var(--accent-blue)" />
                            Exploration Interface
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Use the Graph Explorer to interactively navigate your cloud environment. Nodes represent identities and resources, while edges represent effective permissions.
                        </p>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                            <Activity size={18} color="var(--accent-red)" />
                            Alert Calibration
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Alerts are categorized by their 'Reachability Score'—the mathematical probability that a specific configuration can lead to compromise.
                        </p>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                            <Lock size={18} color="var(--accent-green)" />
                            Data Sovereignity
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Athena processes all metadata locally within your environment. No raw logs or sensitive keys ever leave your infrastructure boundary.
                        </p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '4rem', background: 'var(--accent-purple)', textAlign: 'center', cursor: 'pointer' }}>
                <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Need Further Assistance?</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Access the full API documentation via the Swagger interface.</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: '#fff', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                    Launch Swagger UI <ArrowRight size={18} />
                </div>
            </div>
        </div>
    )
}

export default Docs
