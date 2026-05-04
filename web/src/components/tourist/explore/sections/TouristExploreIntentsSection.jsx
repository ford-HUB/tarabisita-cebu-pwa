import { FiChevronRight, FiCoffee, FiHome, FiMap, FiTruck } from 'react-icons/fi'

const intentIcon = (id) => {
  switch (id) {
    case 'INTENT_FOOD':
      return FiCoffee
    case 'INTENT_STAY':
      return FiHome
    case 'INTENT_RENTAL':
      return FiTruck
    case 'INTENT_EXPERIENCES':
      return FiMap
    default:
      return FiMap
  }
}

const TouristExploreIntentsSection = ({ intents, highlightIntentId, allPartnersActive, onSelect }) => {
  return (
    <section className="space-y-3 md:space-y-4" aria-labelledby="tourist-explore-intents-heading">
      <div>
        <h2 id="tourist-explore-intents-heading" className="text-lg font-semibold tracking-tight text-[#1f1f1f] md:text-xl">
          What do you want to order or book?
        </h2>
        <p className="mt-1.5 max-w-none text-sm leading-relaxed text-[#5b5b5b]">
          Pick a goal — we&apos;ll show partners where you can order food, reserve a stay, arrange transport, or plan
          activities.
        </p>
      </div>

      <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:items-stretch">
        {intents.map((intent) => {
          const Icon = intentIcon(intent.id)
          const isActive = intent.id === highlightIntentId
          return (
            <button
              key={intent.id}
              type="button"
              onClick={() => onSelect(intent.id)}
              className={`flex h-full min-h-[10.5rem] flex-col rounded-2xl border p-3.5 text-left transition sm:min-h-[11rem] sm:p-4 md:p-5 ${
                isActive
                  ? 'border-[#ff7a1a] bg-[#fff8f2] shadow-md ring-1 ring-[#ff7a1a]/30'
                  : 'border-[#e7dfd5] bg-white hover:border-[#d4c4b6] hover:shadow-sm'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isActive ? 'bg-[#ff7a1a] text-white' : 'bg-[#f5eee4] text-[#9b5a2c]'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="mt-3 text-sm font-semibold text-[#1f1f1f]">{intent.label}</span>
              <span className="mt-1 text-xs leading-snug text-[#5b5b5b]">{intent.description}</span>
              {typeof intent.count === 'number' ? (
                <span className="mt-2 text-[11px] font-medium text-[#a79a8b]">
                  {intent.count} partner{intent.count === 1 ? '' : 's'}
                </span>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-medium text-[#ff7a1a]">
                {isActive ? 'Showing matches' : 'Browse'}
                <FiChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[#a79a8b]">Quick reset</span>
        <button
          type="button"
          onClick={() => onSelect('ALL')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            allPartnersActive
              ? 'border-[#ff7a1a] bg-[#ff7a1a] text-white shadow-sm'
              : 'border-[#e7dfd5] bg-white text-[#1f1f1f] hover:border-[#d4c4b6]'
          }`}
        >
          All partners
        </button>
      </div>
    </section>
  )
}

export default TouristExploreIntentsSection
