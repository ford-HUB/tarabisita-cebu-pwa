import { getSystemPerformanceSnapshot } from '../../../shared/utils/systemPerformanceTelemetry.utils.js'

export const getAdminSystemPerformanceSnapshot = () => {
    return getSystemPerformanceSnapshot()
}
