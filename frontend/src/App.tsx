import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GraphExplorer from './pages/GraphExplorer'
import Alerts from './pages/Alerts'
import Response from './pages/Response'
import Logs from './pages/Logs'
import Login from './pages/Login'
import Health from './pages/Health'
import Docs from './pages/Docs'
import Register from './pages/Register'
import UserManagement from './pages/UserManagement'
import { AuthProvider, useAuth } from './context/AuthContext'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth()
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth()
    return (isAuthenticated && user?.role === 'admin') ? <>{children}</> : <Navigate to="/" />
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/graph" element={<GraphExplorer />} />
                                <Route path="/alerts" element={<Alerts />} />
                                <Route path="/response" element={<Response />} />
                                <Route path="/logs" element={<Logs />} />
                                <Route path="/health" element={<Health />} />
                                <Route path="/docs" element={<Docs />} />
                                <Route path="/admin/users" element={
                                    <AdminRoute>
                                        <UserManagement />
                                    </AdminRoute>
                                } />
                            </Routes>
                        </Layout>
                    </ProtectedRoute>
                } />
            </Routes>
        </AuthProvider>
    )
}

export default App
