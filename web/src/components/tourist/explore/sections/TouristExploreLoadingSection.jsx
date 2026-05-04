const TouristExploreLoadingSection = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-64 rounded-2xl bg-[#ebe4dc] md:h-80" />
    <div className="flex gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 w-24 rounded-full bg-[#ebe4dc]" />
      ))}
    </div>
    {[1, 2].map((row) => (
      <div key={row}>
        <div className="mb-3 h-6 w-40 rounded bg-[#ebe4dc]" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((c) => (
            <div key={c} className="h-56 w-44 shrink-0 rounded-xl bg-[#ebe4dc] md:w-52" />
          ))}
        </div>
      </div>
    ))}
  </div>
)

export default TouristExploreLoadingSection
