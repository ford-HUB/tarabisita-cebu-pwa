import { useMemo, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth.hook'

const categories = [
  {
    title: 'Most Visited',
    items: [
      { name: 'Cebu Lechon Hub', type: 'Food', summary: 'Known for crispy skin and group meals.' },
      { name: 'Mountain View Deck', type: 'Scenic', summary: 'A highland stop with wide city views.' },
      { name: 'Heritage Food Walk', type: 'Tour', summary: 'Local guided street-food experience.' },
      { name: 'Sunset Pier Dining', type: 'Dining', summary: 'Seafood dining with sunset ambiance.' }
    ]
  },
  {
    title: 'Restaurants',
    items: [
      { name: 'Casa Kare-Kare', type: 'Filipino', summary: 'Classic comfort dishes in a modern interior.' },
      { name: 'Sutukil Spot', type: 'Seafood', summary: 'Choose fresh catch and pick your cooking style.' },
      { name: 'Tapsilog District', type: 'Budget', summary: 'Affordable all-day breakfast selection.' },
      { name: 'Cafe Coastal', type: 'Cafe', summary: 'Coffee and pastry lounge near the bay.' }
    ]
  },
  {
    title: 'Nature & Spots',
    items: [
      { name: 'Bamboo Falls Trail', type: 'Nature', summary: 'Short hike leading to a cool-water cascade.' },
      { name: 'Cloudline Hills', type: 'Viewpoint', summary: 'Morning fog and mountain breeze destination.' },
      { name: 'Lakeside Picnic Park', type: 'Family', summary: 'Open space ideal for picnics and relax time.' },
      { name: 'Riverwalk Garden', type: 'Relax', summary: 'Quiet walkway with evening light shows.' }
    ]
  }
]

const Home = () => {
  const { user } = useAuth()
  const [selectedItem, setSelectedItem] = useState(null)

  const featuredItems = useMemo(() => categories[0].items, [])

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#e7dfd5] bg-gradient-to-r from-[#9b5a2c] to-[#ff7a1a] p-6 text-white shadow-sm">
        <p className="text-sm uppercase tracking-wider text-white/85">Explore Cebu</p>
        <h1 className="mt-1 text-3xl font-semibold">Hello, {user?.name || 'Tourist'}!</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">
          Discover local businesses, check details in quick modals, and find your next destination by category.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-[#1f1f1f]">Most Visited</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredItems.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelectedItem(item)}
              className="rounded-2xl border border-[#e7dfd5] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[#9b5a2c]">{item.type}</p>
              <p className="mt-2 text-lg font-semibold">{item.name}</p>
              <p className="mt-1 text-sm text-[#5b5b5b]">{item.summary}</p>
            </button>
          ))}
        </div>
      </section>

      {categories.map((category) => (
        <section key={category.title}>
          <h2 className="mb-3 text-xl font-semibold text-[#1f1f1f]">{category.title}</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {category.items.map((item) => (
              <button
                key={`${category.title}-${item.name}`}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="min-w-60 rounded-2xl border border-[#e7dfd5] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[#9b5a2c]">{item.type}</p>
                <p className="mt-2 text-lg font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-[#5b5b5b]">{item.summary}</p>
              </button>
            ))}
          </div>
        </section>
      ))}

      {selectedItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold">{selectedItem.name}</h3>
            <p className="mt-1 text-sm text-[#9b5a2c]">{selectedItem.type}</p>
            <p className="mt-4 text-sm text-[#4f4f4f]">{selectedItem.summary}</p>
            <p className="mt-4 text-sm text-[#4f4f4f]">
              Reservation and map access depend on each business setup.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home