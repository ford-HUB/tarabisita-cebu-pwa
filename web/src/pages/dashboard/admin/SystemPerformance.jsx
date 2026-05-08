import { FiActivity } from 'react-icons/fi'
import { useAdminSystemPerformance } from '../../../hooks/useAdminSystemPerformance.hook'

const logLevelClass = (level) => {
  const normalized = String(level || '').toLowerCase()
  if (normalized === 'error') return 'bg-[#fee2e2] text-[#991b1b]'
  if (normalized === 'warn') return 'bg-[#fef3c7] text-[#92400e]'
  return 'bg-[#dcfce7] text-[#166534]'
}

const statusBadgeClass = (statusCode) => {
  const status = Number(statusCode)
  if (status >= 500) return 'bg-[#fee2e2] text-[#991b1b]'
  if (status >= 400) return 'bg-[#fef3c7] text-[#92400e]'
  if (status >= 200 && status < 300) return 'bg-[#dcfce7] text-[#166534]'
  return 'bg-[#f3f4f6] text-[#374151]'
}

const toUptimeLabel = (secondsRaw) => {
  const seconds = Math.max(Number(secondsRaw) || 0, 0)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours}h ${minutes}m ${secs}s`
}

const SystemPerformance = () => {
  const { isLoading, errorMessage, isSocketConnected, snapshot, kpiCards, responseTimeChart, formatTimestamp, refresh } =
    useAdminSystemPerformance()

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#1f1f1f]">System Performance</h1>
            <p className="mt-1 text-sm text-[#5f5f5f]">
              Real-time API performance, load metrics, and backend logs for admin monitoring.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  isSocketConnected ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
                }`}
              >
                {isSocketConnected ? 'Live socket connected' : 'Socket disconnected'}
              </span>
              <span className="rounded-full bg-[#f5efe7] px-2.5 py-1 text-[#6d645d]">
                Last snapshot: {formatTimestamp(snapshot?.timestamp)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f8f4ee] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiActivity size={14} />
            {isLoading ? 'Refreshing...' : 'Refresh snapshot'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#202020]">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-semibold text-[#1f1f1f]">Response time trend</h2>
          <p className="text-sm text-[#7a7169]">Latest response time points from backend request tracking</p>

          <div className="mt-4 h-72 rounded-xl border border-[#efe4d7] bg-[#fcf8f2] p-4">
            <svg viewBox={`0 0 ${responseTimeChart.chartWidth} ${responseTimeChart.chartHeight + 26}`} className="h-full w-full">
              <defs>
                <linearGradient id="systemPerfAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9b5a2c" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#9b5a2c" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3, 4].map((tick) => {
                const y = (responseTimeChart.chartHeight / 4) * tick
                return (
                  <line
                    key={tick}
                    x1="0"
                    y1={y}
                    x2={responseTimeChart.chartWidth}
                    y2={y}
                    stroke="#efe4d7"
                    strokeWidth="1"
                  />
                )
              })}

              {responseTimeChart.areaPath ? <path d={responseTimeChart.areaPath} fill="url(#systemPerfAreaFill)" /> : null}
              {responseTimeChart.activePath ? (
                <path d={responseTimeChart.activePath} fill="none" stroke="#9b5a2c" strokeWidth="3" strokeLinecap="round" />
              ) : null}
            </svg>
          </div>
        </article>

        <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Runtime details</h2>
          <div className="mt-4 space-y-2 text-sm text-[#4f4f4f]">
            <p>Uptime: {toUptimeLabel(snapshot?.uptimeSeconds)}</p>
            <p>RSS memory: {(Number(snapshot?.memory?.rssMb) || 0).toFixed(2)} MB</p>
            <p>Heap used: {(Number(snapshot?.memory?.heapUsedMb) || 0).toFixed(2)} MB</p>
            <p>Heap total: {(Number(snapshot?.memory?.heapTotalMb) || 0).toFixed(2)} MB</p>
            <p>Load avg (1m): {(Number(snapshot?.cpu?.loadAverage1m) || 0).toFixed(2)}</p>
            <p>Load avg (5m): {(Number(snapshot?.cpu?.loadAverage5m) || 0).toFixed(2)}</p>
            <p>Load avg (15m): {(Number(snapshot?.cpu?.loadAverage15m) || 0).toFixed(2)}</p>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[#1f1f1f]">Backend logs</h2>
        <p className="text-sm text-[#7a7169]">Latest captured console and HTTP log lines from the server process</p>

        {errorMessage ? <p className="mt-3 text-sm text-[#b91c1c]">{errorMessage}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#fcfaf7] text-left text-xs uppercase tracking-wide text-[#9b5a2c]">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {(snapshot?.logs || []).slice(0, 100).map((row, index) => (
                <tr key={`${row.timestamp}-${index}`} className="border-t border-[#f1e8de] text-[#2f2f2f]">
                  <td className="px-3 py-2">{formatTimestamp(row.timestamp)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${logLevelClass(row.level)}`}>
                      {String(row.level || 'info').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.statusCode)}`}>
                      {row.statusCode || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.source || 'app'}</td>
                  <td className="px-3 py-2">{row.message || '—'}</td>
                </tr>
              ))}
              {(snapshot?.logs || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-sm text-[#7a7169]">
                    No logs captured yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default SystemPerformance
