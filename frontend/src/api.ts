import axios from 'axios'

const API_BASE = 'http://localhost:5000'

export const api = {
    // Health & Status
    async getHealth() {
        const res = await axios.get(`${API_BASE}/health`)
        return res.data
    },

    // Graph Data
    async getGraph() {
        const res = await axios.get(`${API_BASE}/api/graph`)
        return res.data
    },

    async getGraphStats() {
        const res = await axios.get(`${API_BASE}/api/graph/stats`)
        return res.data
    },

    // Identities
    async getIdentities() {
        const res = await axios.get(`${API_BASE}/api/identities`)
        return res.data
    },

    async getIdentity(id: string) {
        const res = await axios.get(`${API_BASE}/api/identities/${encodeURIComponent(id)}`)
        return res.data
    },

    // AWS Ingestion
    async ingestAWS() {
        const res = await axios.post(`${API_BASE}/api/ingest/aws`)
        return res.data
    },

    async getCloudTrailEvents(hours: number = 24) {
        const res = await axios.get(`${API_BASE}/api/events/cloudtrail?hours=${hours}`)
        return res.data
    },

    // Detection
    async scanForAttacks(startNode?: string, minDelta: number = 20) {
        const url = startNode
            ? `${API_BASE}/api/detect/scan?start_node=${encodeURIComponent(startNode)}&min_delta=${minDelta}`
            : `${API_BASE}/api/detect/scan?min_delta=${minDelta}`
        const res = await axios.post(url)
        return res.data
    },

    async getAlerts() {
        const res = await axios.get(`${API_BASE}/api/alerts`)
        return res.data
    },

    async getPriorityAlerts() {
        const res = await axios.get(`${API_BASE}/api/alerts/priority`)
        return res.data
    },

    async getAlert(id: string) {
        const res = await axios.get(`${API_BASE}/api/alerts/${encodeURIComponent(id)}`)
        return res.data
    },

    // Response
    async getPendingResponses() {
        const res = await axios.get(`${API_BASE}/api/response/pending`)
        return res.data
    },

    async getResponseHistory() {
        const res = await axios.get(`${API_BASE}/api/response/history`)
        return res.data
    },

    async approveResponse(planId: string) {
        const res = await axios.post(`${API_BASE}/api/response/approve/${encodeURIComponent(planId)}`)
        return res.data
    },

    async rejectResponse(planId: string, reason: string = 'Rejected by analyst') {
        const res = await axios.post(`${API_BASE}/api/response/reject/${encodeURIComponent(planId)}?reason=${encodeURIComponent(reason)}`)
        return res.data
    },

    async executeResponse(planId: string) {
        const res = await axios.post(`${API_BASE}/api/response/execute/${encodeURIComponent(planId)}`)
        return res.data
    },

    async rollbackAction(actionId: string) {
        const res = await axios.post(`${API_BASE}/api/response/rollback/${encodeURIComponent(actionId)}`)
        return res.data
    }
}
