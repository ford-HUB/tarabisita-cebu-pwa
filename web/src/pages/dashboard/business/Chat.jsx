import {
  FiMoreVertical,
  FiPaperclip,
  FiPhone,
  FiSearch,
  FiSend,
  FiSmile,
  FiVideo
} from 'react-icons/fi'

const chatContacts = [
  { id: 1, name: 'Kaiya George', role: 'Project Manager', time: '15 mins', status: 'online' },
  { id: 2, name: 'Lindsey Curtis', role: 'Designer', time: '30 mins', status: 'online' },
  { id: 3, name: 'Zain Geidt', role: 'Content Writer', time: '45 mins', status: 'online' },
  { id: 4, name: 'Carla George', role: 'Front-end Developer', time: '2 days', status: 'away' },
  { id: 5, name: 'Abram Schleifer', role: 'Digital Marketer', time: '3 days', status: 'offline' }
]

const messages = [
  {
    id: 1,
    from: 'customer',
    text: 'Good morning! Can we reserve 4 seats for tomorrow at 7:00 PM?',
    time: '2 hours ago'
  },
  {
    id: 2,
    from: 'business',
    text: 'Yes, we still have available seats for that time.',
    time: '2 hours ago'
  },
  {
    id: 3,
    from: 'customer',
    text: 'Great! Please place it under Cruz family.',
    time: '2 hours ago'
  },
  {
    id: 4,
    from: 'business',
    text: 'Booked. We look forward to serving you tomorrow.',
    time: '1 hour ago'
  }
]

const getStatusColor = (status) => {
  if (status === 'online') return 'bg-[#12b76a]'
  if (status === 'away') return 'bg-[#f79009]'
  return 'bg-[#98a2b3]'
}

const Chat = () => {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Chat</h1>
        <p className="text-sm text-[#6d645d]">Connect with customers and reply in real-time.</p>
      </div>

      <div className="grid min-h-[70dvh] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#e7dfd5] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#2f2f2f]">Chats</h2>
            <button
              type="button"
              className="rounded-lg p-1.5 text-[#6d645d] transition hover:bg-[#f7f3ed]"
              aria-label="More options"
            >
              <FiMoreVertical size={18} />
            </button>
          </div>

          <label className="mb-4 flex items-center gap-2 rounded-xl border border-[#e7dfd5] bg-[#fcfaf7] px-3 py-2">
            <FiSearch size={16} className="text-[#918579]" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-[#3f3a35] outline-none placeholder:text-[#a79a8b]"
            />
          </label>

          <div className="space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(70dvh-160px)]">
            {chatContacts.map((contact, index) => (
              <button
                key={contact.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                  index === 1 ? 'bg-[#f2e8da]' : 'hover:bg-[#f7f3ed]'
                }`}
              >
                <div className="relative">
                  <img
                    src={`https://i.pravatar.cc/100?img=${contact.id + 10}`}
                    alt={contact.name}
                    className="h-11 w-11 rounded-full border border-[#eadfce] object-cover"
                  />
                  <span
                    className={`absolute -right-0.5 bottom-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(contact.status)}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#2f2f2f]">{contact.name}</p>
                  <p className="truncate text-xs text-[#8a8179]">{contact.role}</p>
                </div>
                <span className="text-xs text-[#a79a8b]">{contact.time}</span>
              </button>
            ))}
          </div>
        </aside>

        <article className="flex min-h-[70dvh] flex-col rounded-2xl border border-[#e7dfd5] bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-[#f0e8de] px-5 py-4">
            <div className="flex items-center gap-3">
              <img
                src="https://i.pravatar.cc/100?img=11"
                alt="Lindsey Curtis"
                className="h-11 w-11 rounded-full border border-[#eadfce] object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-[#2f2f2f]">Lindsey Curtis</p>
                <p className="text-xs text-[#12b76a]">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[FiPhone, FiVideo, FiMoreVertical].map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className="rounded-lg p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto bg-[#fcfaf7] px-5 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === 'business' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[70%] space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      message.from === 'business'
                        ? 'rounded-br-md bg-[#9b5a2c] text-white'
                        : 'rounded-bl-md bg-white text-[#2f2f2f] shadow-sm'
                    }`}
                  >
                    {message.text}
                  </div>
                  <p
                    className={`text-xs ${
                      message.from === 'business' ? 'text-right text-[#9f9387]' : 'text-[#9f9387]'
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <footer className="border-t border-[#f0e8de] px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#e7dfd5] bg-white px-3 py-2">
              <button type="button" className="rounded-lg p-1.5 text-[#8a8179] transition hover:bg-[#f7f3ed]">
                <FiSmile size={18} />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-transparent text-sm text-[#3f3a35] outline-none placeholder:text-[#a79a8b]"
              />
              <button type="button" className="rounded-lg p-1.5 text-[#8a8179] transition hover:bg-[#f7f3ed]">
                <FiPaperclip size={18} />
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#9b5a2c] p-2 text-white transition hover:bg-[#824b24]"
              >
                <FiSend size={16} />
              </button>
            </div>
          </footer>
        </article>
      </div>
    </section>
  )
}

export default Chat
