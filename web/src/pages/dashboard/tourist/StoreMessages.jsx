import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTouristStoreMessagingRoom } from '../../../hooks/useTouristStoreMessagingRoom.hook'
import { useAuth } from '../../../hooks/useAuth.hook'
import MessagingHubSection from '../../../components/tourist/messaging/sections/MessagingHubSection'
import MessagingThreadSection from '../../../components/tourist/messaging/sections/MessagingThreadSection'
import OrderSnapshotPanel from '../../../components/tourist/messaging/sections/OrderSnapshotPanel'
import { getTouristStoreDefaultQuickReplies } from '../../../shared/constants/touristStoreMessaging.constants.js'

const StoreMessages = () => {
  const [searchParams] = useSearchParams()
  const m = searchParams.get('m')
  const c = searchParams.get('c')
  const { user } = useAuth()
  const { mode, hub, room, sendMessage } = useTouristStoreMessagingRoom({ m, c })

  useEffect(() => {
    document.title = 'Messages | Tara - Bisita Cebu'
    return () => {
      document.title = 'Tara - Bisita Cebu'
    }
  }, [])

  const currentUserId = user?._id != null ? String(user._id) : user?.id != null ? String(user.id) : null

  if (mode === 'hub') {
    return (
      <div className="space-y-6 md:space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-[#1f1f1f] md:text-3xl">Messages</h1>
          <p className="mt-1 text-sm text-[#5b5b5b]">Chats you have opened with restaurants appear here.</p>
        </header>
        <MessagingHubSection items={hub.items} isLoading={hub.loading} errorMessage={hub.error} />
      </div>
    )
  }

  const session = room.session

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-[#1f1f1f] md:text-3xl">Store messages</h1>
        <p className="mt-1 text-sm text-[#5b5b5b]">
          You are messaging {session?.businessName || 'the store'} about your order.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
        <OrderSnapshotPanel snapshot={session?.orderSnapshot || null} />
        <MessagingThreadSection
          suggestedQuickReplies={getTouristStoreDefaultQuickReplies(session?.orderSnapshot?.orderType)}
          businessName={session?.businessName || ''}
          businessStoreImage={
            typeof session?.businessStoreImage === 'string' && session.businessStoreImage.trim()
              ? session.businessStoreImage.trim()
              : typeof session?.orderSnapshot?.businessStoreImage === 'string'
                ? String(session.orderSnapshot.businessStoreImage).trim()
                : ''
          }
          emptyThreadHint="Say hello to the store — they will see your message here."
          inputId="tourist-store-message-input"
          messages={room.messages}
          currentUserId={currentUserId}
          onSend={sendMessage}
          isConnected={room.socketConnected}
          isLoading={room.loading}
          errorMessage={room.error}
        />
      </div>
    </div>
  )
}

export default StoreMessages
