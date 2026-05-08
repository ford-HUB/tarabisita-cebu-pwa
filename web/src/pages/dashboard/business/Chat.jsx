import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiMessageSquare } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth.hook'
import { useBusinessStoreMessaging } from '../../../hooks/useBusinessStoreMessaging.hook'
import BusinessChatSidebar from '../../../components/business/messaging/sections/BusinessChatSidebar'
import BusinessChatThreadPanel from '../../../components/business/messaging/sections/BusinessChatThreadPanel'
import {
  businessChatHubHref,
  businessDashboardHref
} from '../../../components/layout/business/businessLayout.constants'

const Chat = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const c = searchParams.get('c')
  const { user } = useAuth()
  const normalizedCategory = String(user?.businessCategory || '').trim().toUpperCase()
  const isResortBusiness = normalizedCategory === 'RESORT'
  const { hub, room, sendMessage, deleteConversation } = useBusinessStoreMessaging({ conversationId: c })

  const currentUserId = useMemo(
    () => (user?._id != null ? String(user._id) : user?.id != null ? String(user.id) : null),
    [user?._id, user?.id]
  )

  useEffect(() => {
    document.title = 'Chat | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  return (
    <section className="flex min-h-0 flex-1 flex-col space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Chat</h1>
          <p className="mt-0.5 text-sm text-[#6d645d]">Connect with customers and reply in real time.</p>
        </div>
        <nav className="text-xs text-[#8a8179]" aria-label="Breadcrumb">
          <Link to={businessDashboardHref} className="font-medium text-[#9b5a2c] hover:underline">
            Home
          </Link>
          <span className="mx-1.5 text-[#c4b5a8]">/</span>
          <span className="text-[#4a433c]">Chat</span>
        </nav>
      </div>

      <div className="grid min-h-[calc(100dvh-11rem)] flex-1 gap-4 lg:min-h-[70dvh] lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]">
        <BusinessChatSidebar
          items={hub.items}
          selectedConversationId={c}
          isLoading={hub.loading}
          errorMessage={hub.error}
        />

        <div className="flex min-h-0 min-w-0 flex-col">
          {!c ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#e7dfd5] bg-white/80 px-6 py-16 text-center shadow-sm">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  isResortBusiness ? 'bg-[#fff4e8] text-[#9b5a2c]' : 'bg-[#eff6ff] text-[#2563eb]'
                }`}
              >
                <FiMessageSquare className="h-8 w-8" aria-hidden />
              </div>
              <p className="mt-5 text-base font-semibold text-[#2f2f2f]">Select a conversation</p>
              <p className="mt-2 max-w-sm text-sm text-[#6d645d]">
                Choose a guest on the left to read messages. Each message from a customer shows the related order image
                and details above their text.
              </p>
            </div>
          ) : (
            <BusinessChatThreadPanel
              session={room.session}
              messages={room.messages}
              currentUserId={currentUserId}
              onSend={sendMessage}
              onDeleteConversation={async () => {
                const deleted = await deleteConversation(c)
                if (deleted) navigate(businessChatHubHref)
                return deleted
              }}
              isConnected={room.socketConnected}
              isLoading={room.loading}
              errorMessage={room.error}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default Chat
