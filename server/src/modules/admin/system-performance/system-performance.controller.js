import { getAdminSystemPerformanceSnapshot } from './system-performance.service.js'

export const getSystemPerformanceSnapshotController = async (_req, res) => {
    try {
        const data = getAdminSystemPerformanceSnapshot()
        return res.status(200).json({ message: 'System performance fetched successfully.', data })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch system performance.' })
    }
}
