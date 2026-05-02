const formatTimestamp = (value) => {
  if (!value) return 'Unknown date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return date.toLocaleString()
}

const getSeverityStyles = (severity) => {
  const normalized = String(severity || '').toUpperCase()
  if (normalized === 'CRITICAL' || normalized === 'HIGH') return 'bg-[#fde7e7] text-[#b42318]'
  if (normalized === 'MEDIUM') return 'bg-[#fff1dc] text-[#9b5a2c]'
  return 'bg-[#ecfdf3] text-[#027a48]'
}

const SecurityActivityModal = ({
  isOpen,
  isActivityPanelOpen,
  isLoadingActivityLogs,
  activityLogs,
  onClose,
  onToggleActivityPanel
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-5xl flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
          <h4 className="text-lg font-semibold text-[#1f1f1f]">Account Security Center</h4>
          <p className="mt-2 text-sm text-[#5b5b5b]">
            Protect your business account by reviewing security standards and monitoring account activity.
          </p>

          <div className="mt-4 rounded-xl border border-[#efe6dc] bg-[#fffdf9] p-4">
            <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Security Standards</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4f4f4f]">
              <li>Use a strong password with at least 12 characters and mixed symbols.</li>
              <li>Update your password every 60-90 days for safer account protection.</li>
              <li>Do not share credentials with staff; use one account per authorized owner.</li>
              <li>Review suspicious devices and location-based sign-ins regularly.</li>
              <li>Track profile, billing, and menu changes using Activity Log history.</li>
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-[#efe6dc] bg-[#fffdf9] p-4">
            <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Activity Log</p>
            <p className="mt-2 text-sm text-[#4f4f4f]">
              Open a detailed timeline of account actions, including action type, timestamp, status, IP, and device
              context.
            </p>
            <button
              type="button"
              onClick={onToggleActivityPanel}
              className="mt-3 rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12]"
            >
              {isActivityPanelOpen ? 'Hide Activity Log' : 'Show Activity Log'}
            </button>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
            >
              Close
            </button>
          </div>
        </div>

        {isActivityPanelOpen && (
          <div className="w-full max-w-xl rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h5 className="text-base font-semibold text-[#1f1f1f]">Recent Activity Logs</h5>
              <span className="rounded-full bg-[#f5eee4] px-3 py-1 text-xs text-[#7d7164]">Latest 30</span>
            </div>
            <p className="mt-1 text-xs text-[#7d7164]">
              Includes account security, profile updates, menu changes, billing actions, and verification events.
            </p>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {isLoadingActivityLogs ? (
                <p className="text-sm text-[#5b5b5b]">Loading activity logs...</p>
              ) : activityLogs.length ? (
                activityLogs.map((log) => (
                  <article key={log.id} className="rounded-xl border border-[#efe6dc] bg-[#fffdf9] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#1f1f1f]">{log.action}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSeverityStyles(log.severity)}`}>
                        {log.severity}
                      </span>
                      <span className="rounded-full bg-[#f5eee4] px-2 py-0.5 text-[10px] font-semibold text-[#7d7164]">
                        {log.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5b5b5b]">{log.description}</p>
                    <div className="mt-2 grid gap-1 text-[11px] text-[#7d7164]">
                      <p>Category: {log.category}</p>
                      <p>Date: {formatTimestamp(log.createdAt)}</p>
                      <p>IP Address: {log.ipAddress || 'N/A'}</p>
                      <p>Device: {log.device || 'N/A'}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-[#5b5b5b]">No activity logs yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SecurityActivityModal
