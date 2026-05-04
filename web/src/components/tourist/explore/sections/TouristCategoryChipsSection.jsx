const TouristCategoryChipsSection = ({ chips, activeId, onSelect, layout = 'inline' }) => {
  const stacked = layout === 'stacked'
  return (
    <div className={stacked ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
      {chips.map((chip) => {
        const isActive = chip.id === activeId
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={`border text-sm font-medium transition ${
              stacked
                ? `w-full rounded-xl px-3 py-2 text-left ${
                    isActive
                      ? 'border-[#ff7a1a] bg-[#fff8f2] text-[#9b5a2c] shadow-sm'
                      : 'border-[#e7dfd5] bg-white text-[#1f1f1f] hover:border-[#d4c4b6]'
                  }`
                : `rounded-full px-4 py-2 ${
                    isActive
                      ? 'border-[#ff7a1a] bg-[#ff7a1a] text-white shadow-sm'
                      : 'border-[#e7dfd5] bg-white text-[#1f1f1f] hover:border-[#d4c4b6]'
                  }`
            }`}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}

export default TouristCategoryChipsSection
