import { useCallback, useMemo, useState } from 'react'
import { FiSend } from 'react-icons/fi'
import { DEFAULT_QUICK_REPLIES } from '../../../../shared/constants/touristStoreMessaging.constants.js'

const bubbleRow = (mine) =>
  mine
    ? 'ml-auto max-w-[85%] rounded-2xl bg-[#ff7a1a] px-3 py-2 text-white shadow-sm'
    : 'inline-block w-max max-w-full rounded-2xl border border-[#e7dfd5] bg-white px-3 py-2 text-[#1f1f1f] shadow-sm'


const MessagingThreadSection = ({
  businessName = '',
  businessStoreImage = '',
  threadTitle,
  touristSenderLabel = 'Guest',
  businessSenderLabel,
  messages,
  currentUserId,
  onSend,
  isConnected,
  isLoading,
  errorMessage,
  emptyThreadHint,
  inputId = 'store-message-input',
  suggestedQuickReplies
}) => {
  const [draft, setDraft] = useState('')

  const quickReplies = useMemo(() => {
    const raw = Array.isArray(suggestedQuickReplies) ? suggestedQuickReplies : DEFAULT_QUICK_REPLIES
    const seen = new Set()
    return raw
      .filter((s) => typeof s === 'string')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !seen.has(s) && seen.add(s))
  }, [suggestedQuickReplies])

  const visibleQuickReplies = useMemo(
    () => quickReplies.filter((phrase) => !draft.includes(phrase)),
    [draft, quickReplies]
  )

  const insertQuickReply = useCallback((phrase) => {
    setDraft((prev) => {
      if (prev.includes(phrase)) return prev
      const tail = prev.replace(/\s+$/, '')
      return tail ? `${tail} ${phrase}` : phrase
    })
  }, [])

  const submit = useCallback(() => {
    const t = draft.trim()
    if (!t) return
    onSend(t)
    setDraft('')
  }, [draft, onSend])

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#e7dfd5] bg-white p-8 shadow-sm">
        <p className="text-sm text-[#5b5b5b]">Connecting to chat…</p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-6 text-sm text-[#7a271a]">
        <p className="font-medium">Chat unavailable</p>
        <p className="mt-1">{errorMessage}</p>
      </div>
    )
  }

  const headerTitle = (threadTitle ?? businessName) || 'Store'
  const storeImage = typeof businessStoreImage === 'string' ? businessStoreImage.trim() : ''
  const storeInitial = (businessName || 'S').trim().slice(0, 1).toUpperCase() || 'S'

  const labelForSender = (m) => {
    const mine = currentUserId && String(m.senderUserId) === String(currentUserId)
    if (mine) return 'You'
    if (m.senderRole === 'BUSINESS') {
      return (businessSenderLabel ?? businessName) || 'Store'
    }
    return touristSenderLabel
  }

  return (
    <div className="flex min-h-[420px] flex-col rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
      <div className="border-b border-[#f0e8de] px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#eadfce] bg-[#f0e8de]">
            {storeImage ? (
              <img
                src={storeImage}
                alt={businessName ? `${businessName} logo` : 'Store logo'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#9b5a2c]">
                {storeInitial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#1f1f1f]">{headerTitle}</p>
            <p className="text-xs text-[#9f9387]">
              {isConnected ? 'Live · you can type a message below' : 'Connecting…'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 md:p-5" style={{ maxHeight: 'min(55vh, 420px)' }}>
        {!messages.length ? (
          <p className="text-center text-sm text-[#9f9387]">
            {emptyThreadHint || 'Say hello — the other party will see your message here.'}
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = currentUserId && String(m.senderUserId) === String(currentUserId)
          const label = labelForSender(m)

          if (mine) {
            return (
              <div key={m.id} className="flex flex-col gap-0.5 items-end">
                <span className="px-1 text-[10px] font-medium uppercase tracking-wide text-[#9f9387]">{label}</span>
                <div className={bubbleRow(true)}>
                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={m.id} className="flex min-w-0 justify-start gap-2.5">
              <div className="relative mt-1 h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-[#f0e8de]">
                {storeImage ? (
                  <img
                    src={storeImage}
                    alt={businessName ? `${businessName} logo` : 'Store logo'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[#9b5a2c]">
                    {storeInitial}
                  </div>
                )}
              </div>
              <div className="inline-flex min-w-0 max-w-[min(100%,calc(100%-2.25rem-0.625rem))] flex-col gap-0.5 items-stretch">
                <span className="px-1 text-[10px] font-medium uppercase tracking-wide text-[#9f9387]">{label}</span>
                <div className={bubbleRow(false)}>
                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-[#f0e8de] p-3 md:p-4">
        <div className="relative">
          {isConnected && visibleQuickReplies.length > 0 ? (
            <div
              className="pointer-events-none absolute bottom-full left-0 right-0 z-10 mb-1 flex flex-wrap gap-1.5"
              role="group"
              aria-label="Suggested messages"
            >
              {visibleQuickReplies.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => insertQuickReply(phrase)}
                  className="pointer-events-auto max-w-full rounded-full border border-[#e7dfd5] bg-white px-3 py-1.5 text-left text-xs font-medium leading-snug text-[#3f3a35] shadow-sm transition hover:border-[#ff7a1a]/50 hover:bg-[#fff5ed] hover:text-[#1f1f1f]"
                >
                  <span className="line-clamp-2">{phrase}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor={inputId}>
              Message
            </label>
            <textarea
              id={inputId}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={isConnected ? 'Write a message…' : 'Waiting for connection…'}
              disabled={!isConnected}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#e7dfd5] bg-[#fffaf6] px-3 py-2 text-sm text-[#1f1f1f] outline-none ring-0 transition placeholder:text-[#9f9387] focus:border-[#d4c4b4] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!isConnected || !draft.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff7a1a] text-white shadow-sm transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-50"
              title="Send"
            >
              <FiSend className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagingThreadSection
