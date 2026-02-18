import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GraphExplorer from './pages/GraphExplorer'
import Alerts from './pages/Alerts'
import Response from './pages/Response'

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/graph" element={<GraphExplorer />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/response" element={<Response />} />
            </Routes>
        </Layout>
    )
}

export default App
