import { useCallback, useState } from 'react'
import { FiMoreVertical, FiSend } from 'react-icons/fi'
import { formatChatTime } from '../utils/formatChatTime.js'
import OrderSnippetAboveMessage from './OrderSnippetAboveMessage.jsx'

/**
 * @param {{
 *   session: {
 *     touristName?: string,
 *     touristAvatar?: string,
 *     orderSnapshot?: Record<string, unknown> | null,
 *   } | null,
 *   messages: { id: string, body: string, senderRole: string, senderUserId: string, createdAt?: string }[],
 *   currentUserId: string | null,
 *   onSend: (text: string) => void,
 *   isConnected: boolean,
 *   isLoading: boolean,
 *   errorMessage: string | null
 * }} props
 */
const BusinessChatThreadPanel = ({
  session,
  messages,
  currentUserId,
  onSend,
  isConnected,
  isLoading,
  errorMessage
}) => {
  const [draft, setDraft] = useState('')

  const submit = useCallback(() => {
    const t = draft.trim()
    if (!t) return
    onSend(t)
    setDraft('')
  }, [draft, onSend])

  const touristName = session?.touristName?.trim() || 'Guest'
  const touristAvatar = session?.touristAvatar?.trim() || ''
  const orderSnapshot = session?.orderSnapshot && typeof session.orderSnapshot === 'object' ? session.orderSnapshot : null

  if (isLoading) {
    return (
      <article className="flex min-h-[420px] flex-1 items-center justify-center rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
        <p className="text-sm text-[#5b5b5b]">Opening conversation…</p>
      </article>
    )
  }

  if (errorMessage) {
    return (
      <article className="rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-6 text-sm text-[#7a271a] shadow-sm">
        <p className="font-medium">Chat unavailable</p>
        <p className="mt-1">{errorMessage}</p>
      </article>
    )
  }

  return (
    <article className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-sm lg:min-h-[70dvh]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#f0e8de] px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative isolate h-11 w-11 shrink-0">
            <div className="h-full w-full overflow-hidden rounded-full border border-[#eadfce] bg-[#f0e8de]">
              {touristAvatar ? (
                <img src={touristAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#9b5a2c]">
                  {touristName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <span
              className={`pointer-events-none absolute bottom-0 right-0 z-10 h-3 w-3 translate-x-px translate-y-px rounded-full border-[2.5px] border-white shadow-sm ${
                isConnected ? 'bg-[#12b76a]' : 'bg-[#98a2b3]'
              }`}
              aria-hidden
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#2f2f2f]">{touristName}</p>
            <p className="text-xs text-[#12b76a]">{isConnected ? 'Live' : 'Connecting…'}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" className="rounded-lg p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]" aria-label="More">
            <FiMoreVertical size={18} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#fcfaf7] px-4 py-5 md:px-6">
        {!messages.length ? (
          <p className="text-center text-sm text-[#9f9387]">
            No messages yet. When the guest writes from their order, you will see it here with the order details above
            their text.
          </p>
        ) : null}

        {messages.map((m) => {
          const mine = Boolean(currentUserId && String(m.senderUserId) === String(currentUserId))
          const time = formatChatTime(m.createdAt)

          if (mine) {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="flex max-w-[min(100%,85%)] flex-col items-end gap-1">
                  <div className="inline-block w-max max-w-full rounded-2xl rounded-br-md bg-[#2563eb] px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                    <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
                  </div>
                  <p className="text-right text-xs text-[#9f9387]">{time}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={m.id} className="flex min-w-0 justify-start gap-2.5">
              <div className="relative mt-1 h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-[#f0e8de]">
                {touristAvatar ? (
                  <img src={touristAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[#9b5a2c]">
                    {touristName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="inline-flex min-w-0 max-w-[min(100%,85%)] flex-col items-stretch gap-1.5">
                {m.senderRole === 'TOURIST' ? <OrderSnippetAboveMessage snapshot={orderSnapshot} /> : null}
                <div className="inline-block w-max max-w-full rounded-2xl rounded-bl-md border border-[#e7dfd5] bg-white px-4 py-2.5 text-sm leading-relaxed text-[#2f2f2f] shadow-sm">
                  <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
                </div>
                <p className="text-xs text-[#9f9387]">
                  {touristName}
                  {time ? ` · ${time}` : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <footer className="shrink-0 border-t border-[#f0e8de] bg-white px-3 py-3 md:px-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 md:px-4">
          <label className="sr-only" htmlFor="business-chat-composer">
            Type a message
          </label>
          <textarea
            id="business-chat-composer"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={isConnected ? 'Type a message…' : 'Waiting for connection…'}
            disabled={!isConnected}
            className="min-h-10 max-h-28 flex-1 resize-none bg-transparent py-2.5 text-sm leading-snug text-[#3f3a35] outline-none placeholder:text-[#a79a8b] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!isConnected || !draft.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full bg-[#2563eb] text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
            title="Send"
          >
            <FiSend className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </footer>
    </article>
  )
}

export default BusinessChatThreadPanel
