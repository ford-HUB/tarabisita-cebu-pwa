import { categoryDisplayLabel } from '../../../../shared/utils/touristExplore.utils.js'

const thumb = (business) => business?.banner || business?.coverImage || business?.logo

const TouristBusinessCarouselSection = ({ title, items, onOpen }) => {
  if (!items?.length) return null

  return (
    <section aria-label={title} className="scroll-mt-4">
      <h2 className="mb-2.5 text-base font-semibold tracking-tight text-[#1f1f1f] md:mb-3 md:text-xl">{title}</h2>
      <div
        className={
          'gap-3 pb-2 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:pb-3 ' +
          'max-md:[-ms-overflow-style:none] max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden ' +
          'md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] md:gap-4 md:overflow-visible'
        }
      >
        {items.map((business) => {
          const img = thumb(business)
          const label = categoryDisplayLabel(business.category)
          return (
            <button
              key={String(business._id)}
              type="button"
              onClick={() => onOpen(business)}
              className="group relative max-md:w-44 max-md:max-w-[min(85vw,13.5rem)] max-md:snap-start max-md:shrink-0 overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#1a120c] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:min-w-0 md:w-full"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {img ? (
                  <img src={img} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background: `linear-gradient(160deg, ${business.themeColor || '#9b5a2c'}, #3d2918)`
                    }}
                />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#ffd4bc]">{label}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{business.name}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default TouristBusinessCarouselSection
