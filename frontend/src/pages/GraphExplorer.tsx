import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import { X, Search } from 'lucide-react'
import { api } from '../api'

interface GraphNode {
    id: string
    type: string
    name: string
    privilege_level: number
    x?: number
    y?: number
    z?: number
}

interface GraphLink {
    source: string | GraphNode
    target: string | GraphNode
    edge_type: string
}

interface GraphData {
    nodes: GraphNode[]
    links: GraphLink[]
}

function GraphExplorer() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set())
    const [highlightLinks, setHighlightLinks] = useState<Set<any>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [riskIndex, setRiskIndex] = useState(-1)
    const fgRef = useRef<any>(null)

    // Parse attack path from URL
    const attackPath = useMemo(() => {
        const pathParam = searchParams.get('attackPath')
        if (pathParam) {
            try {
                return JSON.parse(decodeURIComponent(pathParam)) as string[]
            } catch {
                return null
            }
        }
        return null
    }, [searchParams])

    const alertId = searchParams.get('alertId')

    const fetchGraph = useCallback(async () => {
        try {
            const data = await api.getGraph()
            setGraphData({
                nodes: data.nodes,
                links: data.edges.map((e: any) => ({
                    source: e.source,
                    target: e.target,
                    edge_type: e.edge_type
                }))
            })
        } catch (error) {
            console.error('Failed to fetch graph:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchGraph()
    }, [fetchGraph])

    // Highlight attack path when loaded
    useEffect(() => {
        if (attackPath && graphData.nodes.length > 0) {
            const pathSet = new Set(attackPath)
            setHighlightNodes(pathSet)

            // Highlight links between consecutive path nodes
            const pathLinks = new Set<any>()
            graphData.links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source
                const targetId = typeof link.target === 'object' ? link.target.id : link.target

                for (let i = 0; i < attackPath.length - 1; i++) {
                    if ((sourceId === attackPath[i] && targetId === attackPath[i + 1]) ||
                        (targetId === attackPath[i] && sourceId === attackPath[i + 1])) {
                        pathLinks.add(link)
                    }
                }
            })
            setHighlightLinks(pathLinks)

            // Zoom to fit the attack path after a delay
            setTimeout(() => {
                if (fgRef.current) {
                    fgRef.current.zoomToFit(1000, 150)
                }
            }, 1000)
        } else if (fgRef.current && graphData.nodes.length > 0) {
            setTimeout(() => {
                fgRef.current.zoomToFit(1200, 120)
            }, 800)
        }
    }, [attackPath, graphData])

    const clearAttackPath = () => {
        setSearchParams({})
        setHighlightNodes(new Set())
        setHighlightLinks(new Set())
    }

    const getNodeColor = (node: GraphNode) => {
        if (attackPath && attackPath.includes(node.id)) {
            // Attack path colors
            const idx = attackPath.indexOf(node.id)
            if (idx === 0) return '#22c55e' // Start - green
            if (idx === attackPath.length - 1) return '#ef4444' // End - red
            return '#f59e0b' // Middle - orange
        }
        if (highlightNodes.has(node.id)) return '#ffffff'
        switch (node.type) {
            case 'iam_user': return '#3b82f6'
            case 'iam_role': return '#a855f7'
            case 'iam_group': return '#06b6d4'
            case 'policy': return '#f59e0b'
            case 'resource': return '#ef4444'
            default: return '#64748b'
        }
    }

    const getNodeSize = (node: GraphNode) => {
        const isInPath = attackPath?.includes(node.id)
        const baseSize = isInPath ? 12 : highlightNodes.has(node.id) ? 10 : 7
        return baseSize + (node.privilege_level / 20)
    }

    const handleNodeHover = (node: GraphNode | null) => {
        if (attackPath) return // Don't override attack path highlighting

        highlightNodes.clear()
        highlightLinks.clear()

        if (node) {
            highlightNodes.add(node.id)
            graphData.links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source
                const targetId = typeof link.target === 'object' ? link.target.id : link.target
                if (sourceId === node.id || targetId === node.id) {
                    highlightLinks.add(link)
                    highlightNodes.add(sourceId)
                    highlightNodes.add(targetId)
                }
            })
        }

        setHighlightNodes(new Set(highlightNodes))
        setHighlightLinks(new Set(highlightLinks))
    }

    const handleNodeClick = useCallback((node: GraphNode) => {
        setSelectedNode(node)
        if (fgRef.current) {
            const distance = 150
            const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1)
            fgRef.current.cameraPosition(
                { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
                node,
                2000
            )
        }
    }, [])

    const handleZoomToFit = () => {
        if (fgRef.current) fgRef.current.zoomToFit(750, 100)
    }

    const focusOnNode = useCallback((node: GraphNode) => {
        if (!fgRef.current) return
        const distance = 160
        const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1)
        fgRef.current.cameraPosition(
            { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
            node,
            1200
        )
        setSelectedNode(node)
    }, [])

    const handleNextRisk = () => {
        const highRiskNodes = graphData.nodes
            .filter(n => n.privilege_level > 70 || (attackPath && attackPath.includes(n.id)))
            .sort((a, b) => b.privilege_level - a.privilege_level)

        if (highRiskNodes.length === 0) return

        const nextIdx = (riskIndex + 1) % highRiskNodes.length
        setRiskIndex(nextIdx)
        focusOnNode(highRiskNodes[nextIdx])
    }

    const filteredSearchResults = useMemo(() => {
        if (!searchQuery) return []
        return graphData.nodes
            .filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 5)
    }, [searchQuery, graphData.nodes])

    // Custom 3D node objects
    const nodeThreeObject = useCallback((node: GraphNode) => {
        const isInPath = attackPath?.includes(node.id)
        const isHighlighted = highlightNodes.has(node.id)
        const color = getNodeColor(node)
        const size = getNodeSize(node)

        // Create sphere with glow
        const geometry = new THREE.SphereGeometry(size, 32, 32)
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: isInPath || isHighlighted ? 1 : 0.85
        })
        const sphere = new THREE.Mesh(geometry, material)

        // Add glow effect for attack path or high privilege nodes
        if (isInPath || node.privilege_level > 60 || isHighlighted) {
            const glowGeometry = new THREE.SphereGeometry(size * 1.6, 16, 16)
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isInPath ? 0.3 : 0.15
            })
            const glow = new THREE.Mesh(glowGeometry, glowMaterial)
            sphere.add(glow)
        }

        // Add label
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = 256
        canvas.height = 64
        ctx.fillStyle = 'rgba(0,0,0,0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.font = isInPath ? 'bold 28px Inter, sans-serif' : 'bold 24px Inter, sans-serif'
        ctx.fillStyle = isInPath ? '#ffffff' : 'rgba(255,255,255,0.9)'
        ctx.textAlign = 'center'
        ctx.fillText(node.name, 128, 40)

        const texture = new THREE.CanvasTexture(canvas)
        const labelMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true })
        const label = new THREE.Sprite(labelMaterial)
        label.scale.set(isInPath ? 50 : 40, isInPath ? 12 : 10, 1)
        label.position.set(0, size + 10, 0)
        sphere.add(label)

        return sphere
    }, [highlightNodes, graphData, attackPath])

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading Identity Graph...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', height: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a2e 50%, #0a0e1a 100%)' }}>
            {/* Attack Path Banner */}
            {attackPath && (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 20,
                    background: 'linear-gradient(90deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))',
                    border: '1px solid rgba(239,68,68,0.5)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>🚨 Attack Path: {alertId}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {attackPath.length} hops: {attackPath.map(n => n.split(':')[1] || n).join(' → ')}
                    </span>
                    <button
                        onClick={clearAttackPath}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={16} color="#fff" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div style={{
                position: 'absolute',
                top: attackPath ? '5rem' : '1.5rem',
                left: '280px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: attackPath ? 'linear-gradient(90deg, #22c55e, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {attackPath ? 'Attack Path Visualization' : 'Identity Graph'}
                </h1>
                <span style={{
                    padding: '0.4rem 1rem',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    color: '#3b82f6'
                }}>
                    {graphData.nodes.length} nodes • {graphData.links.length} edges
                </span>
                <button className="btn btn-secondary" onClick={handleZoomToFit} style={{ padding: '0.5rem 1rem' }}>
                    Center
                </button>
                <button className="btn btn-primary" onClick={handleNextRisk} style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                    border: 'none'
                }}>
                    Next Risk
                </button>

                {/* Node Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                        type="text"
                        placeholder="Search identities..."
                        className="input"
                        style={{ height: '40px', paddingLeft: '35px', width: '220px', background: 'rgba(15, 23, 42, 0.4)' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {filteredSearchResults.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'rgba(10, 14, 26, 0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            marginTop: '0.5rem',
                            overflow: 'hidden',
                            zIndex: 50
                        }}>
                            {filteredSearchResults.map(node => (
                                <div
                                    key={node.id}
                                    onClick={() => {
                                        focusOnNode(node)
                                        setSearchQuery('')
                                    }}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'background 0.2s'
                                    }}
                                    className="search-result-item"
                                >
                                    <div style={{ fontWeight: 600 }}>{node.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{node.type}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button className="btn btn-secondary" onClick={fetchGraph} style={{ padding: '0.5rem 1rem' }}>
                    Refresh
                </button>
            </div>

            {/* Legend */}
            <div style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '280px',
                zIndex: 10,
                background: 'rgba(10, 14, 26, 0.9)',
                backdropFilter: 'blur(20px)',
                padding: '1rem 2rem',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '2.5rem'
            }}>
                {attackPath ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 12px #22c55e60' }} />
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Start</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 12px #f59e0b60' }} />
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Hop</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 12px #ef444460' }} />
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Target</span>
                        </div>
                    </>
                ) : (
                    [
                        { color: '#3b82f6', label: 'User' },
                        { color: '#a855f7', label: 'Role' },
                        { color: '#06b6d4', label: 'Group' },
                        { color: '#f59e0b', label: 'Policy' }
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, boxShadow: `0 0 12px ${item.color}60` }} />
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Selected Node Panel */}
            {selectedNode && (
                <div style={{
                    position: 'absolute',
                    top: attackPath ? '5rem' : '1.5rem',
                    right: '1.5rem',
                    zIndex: 10,
                    background: 'rgba(10, 14, 26, 0.95)',
                    backdropFilter: 'blur(20px)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    width: '320px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: getNodeColor(selectedNode),
                            boxShadow: `0 0 20px ${getNodeColor(selectedNode)}`
                        }} />
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedNode.name}</h3>
                    </div>

                    <div style={{
                        display: 'grid',
                        gap: '0.8rem',
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.7)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Type</span>
                            <span style={{
                                padding: '0.2rem 0.8rem',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff'
                            }}>{selectedNode.type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Privilege Level</span>
                            <span style={{
                                padding: '0.2rem 0.8rem',
                                borderRadius: '6px',
                                background: selectedNode.privilege_level > 70 ? 'rgba(239,68,68,0.2)' :
                                    selectedNode.privilege_level > 40 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                                color: selectedNode.privilege_level > 70 ? '#ef4444' :
                                    selectedNode.privilege_level > 40 ? '#f59e0b' : '#10b981',
                                fontWeight: 600
                            }}>
                                {selectedNode.privilege_level}
                            </span>
                        </div>
                        {attackPath && attackPath.includes(selectedNode.id) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Path Position</span>
                                <span style={{
                                    padding: '0.2rem 0.8rem',
                                    background: 'rgba(239,68,68,0.2)',
                                    borderRadius: '6px',
                                    color: '#ef4444',
                                    fontWeight: 600
                                }}>
                                    Hop {attackPath.indexOf(selectedNode.id) + 1} of {attackPath.length}
                                </span>
                            </div>
                        )}
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            wordBreak: 'break-all'
                        }}>
                            {selectedNode.id}
                        </div>
                    </div>

                    <button
                        onClick={() => setSelectedNode(null)}
                        style={{
                            marginTop: '1rem',
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Close
                    </button>
                </div>
            )}

            {/* 3D Graph */}
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                nodeThreeObject={nodeThreeObject}
                nodeThreeObjectExtend={false}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                linkColor={(link: any) => {
                    if (highlightLinks.has(link)) return '#ef4444'
                    return 'rgba(148, 163, 184, 0.4)'
                }}
                linkWidth={(link: any) => highlightLinks.has(link) ? 5 : 2}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                linkOpacity={0.7}
                linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 8 : 1}
                linkDirectionalParticleWidth={4}
                linkDirectionalParticleSpeed={0.02}
                linkDirectionalParticleColor={(link: any) => highlightLinks.has(link) ? '#ef4444' : '#60a5fa'}
                backgroundColor="rgba(0,0,0,0)"
                enableNodeDrag={true}
                d3AlphaDecay={0.01}
                d3VelocityDecay={0.3}
                forceEngine="d3"
                numDimensions={3}
                cooldownTicks={100}
                onEngineStop={() => {
                    // One final zoom to fit after the simulation stabilizes
                    if (fgRef.current) fgRef.current.zoomToFit(1000, 100)
                }}
            />
        </div>
    )
}

export default GraphExplorer
