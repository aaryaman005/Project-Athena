/// <reference types="vite/client" />
import axios from 'axios'

const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000')

// Create axios instance for cleaner configuration
const client = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add token to requests
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('athena_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Global error interceptor
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.detail || error.message || 'An unexpected error occurred'
        console.error(`[API Error] ${error.config?.url}:`, message)
        return Promise.reject(error)
    }
)

export const api = {
    // Health & Status
    async getHealth() {
        const res = await client.get('/api/health')
        return res.data
    },

    // Graph Data
    async getGraph() {
        const res = await client.get('/api/graph')
        return res.data
    },

    async getGraphStats() {
        const res = await client.get('/api/graph/stats')
        return res.data
    },

    // Identities
    async getIdentities() {
        const res = await client.get('/api/identities')
        return res.data
    },

    async getIdentity(id: string) {
        const res = await client.get(`/api/identities/${encodeURIComponent(id)}`)
        return res.data
    },

    // AWS Ingestion
    async ingestAWS() {
        const res = await client.post('/api/ingest/aws')
        return res.data
    },

    async getCloudTrailEvents(hours: number = 24) {
        const res = await client.get(`/api/events/cloudtrail?hours=${hours}`)
        return res.data
    },

    // Detection
    async scanForAttacks(startNode?: string, minDelta: number = 20) {
        const url = startNode
            ? `/api/detect/scan?start_node=${encodeURIComponent(startNode)}&min_delta=${minDelta}`
            : `/api/detect/scan?min_delta=${minDelta}`
        const res = await client.post(url)
        return res.data
    },

    async getAlerts() {
        const res = await client.get('/api/alerts')
        return res.data
    },

    async getPriorityAlerts() {
        const res = await client.get('/api/alerts/priority')
        return res.data
    },

    async getAlert(id: string) {
        const res = await client.get(`/api/alerts/${encodeURIComponent(id)}`)
        return res.data
    },

    // Response
    async getPendingResponses() {
        const res = await client.get('/api/response/pending')
        return res.data
    },

    async getResponseHistory() {
        const res = await client.get('/api/response/history')
        return res.data
    },

    async approveResponse(planId: string) {
        const res = await client.post(`/api/response/approve/${encodeURIComponent(planId)}`)
        return res.data
    },

    async rejectResponse(planId: string, reason: string = 'Rejected by analyst') {
        const res = await client.post(`/api/response/reject/${encodeURIComponent(planId)}?reason=${encodeURIComponent(reason)}`)
        return res.data
    },

    async executeResponse(planId: string) {
        const res = await client.post(`/api/response/execute/${encodeURIComponent(planId)}`)
        return res.data
    },

    async rollbackAction(actionId: string) {
        const res = await client.post(`/api/response/rollback/${encodeURIComponent(actionId)}`)
        return res.data
    },

    // Audit
    async getAuditLogs() {
        const res = await client.get('/api/audit/logs')
        return res.data
    },

    // Auth
    async login(username: string, password: string) {
        const params = new URLSearchParams()
        params.append('username', username)
        params.append('password', password)
        const res = await client.post('/api/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        return res.data
    },

    async register(username: string, password: string) {
        const res = await client.post('/api/auth/register', { username, password })
        return res.data
    },

    // Admin User Management
    async listUsers() {
        const res = await client.get('/api/auth/users')
        return res.data
    },

    async deleteUser(username: string) {
        const res = await client.delete(`/api/auth/users/${encodeURIComponent(username)}`)
        return res.data
    },

    async updateUserRole(username: string, role: string) {
        const res = await client.patch(`/api/auth/users/${encodeURIComponent(username)}/role?role=${encodeURIComponent(role)}`)
        return res.data
    }
}
