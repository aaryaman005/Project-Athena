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
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected App Routes */}
                <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/graph" element={<ProtectedRoute><Layout><GraphExplorer /></Layout></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
                <Route path="/response" element={<ProtectedRoute><Layout><Response /></Layout></ProtectedRoute>} />
                <Route path="/logs" element={<ProtectedRoute><Layout><Logs /></Layout></ProtectedRoute>} />
                <Route path="/health" element={<ProtectedRoute><Layout><Health /></Layout></ProtectedRoute>} />
                <Route path="/docs" element={<ProtectedRoute><Layout><Docs /></Layout></ProtectedRoute>} />
                <Route path="/admin/users" element={<AdminRoute><Layout><UserManagement /></Layout></AdminRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    )
}

export default App
