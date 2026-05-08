const TouristCartItemMeta = ({ item, density = 'comfortable' }) => {
  const listingType = String(item?.listingType || '').trim().toUpperCase()
  const desc = typeof item.description === 'string' ? item.description.trim() : ''
  const category = typeof item.category === 'string' ? item.category.trim() : ''
  const categoryNorm = category.toLowerCase()
  const isStayItem =
    listingType === 'STAY' ||
    categoryNorm.includes('resort') ||
    categoryNorm.includes('hotel') ||
    categoryNorm.includes('accommodation') ||
    categoryNorm.includes('room') ||
    categoryNorm.includes('villa') ||
    categoryNorm.includes('suite')
  const flavor = typeof item.flavor === 'string' ? item.flavor.trim() : ''
  const prep = typeof item.preparationTime === 'string' ? item.preparationTime.trim() : ''
  const serving = typeof item.servingSize === 'string' ? item.servingSize.trim() : ''
  const spiceRaw = typeof item.spiceLevel === 'string' ? item.spiceLevel.trim() : ''
  const spice = spiceRaw && spiceRaw !== 'No Spice' ? spiceRaw : ''
  const allergens = typeof item.allergens === 'string' ? item.allergens.trim() : ''
  const amenities = typeof item.amenities === 'string' ? item.amenities.trim() : ''
  const detailTail = isStayItem ? amenities || allergens : allergens

  const bits = []
  if (flavor) bits.push(`${isStayItem ? 'Style' : 'Flavor'}: ${flavor}`)
  if (prep) bits.push(`${isStayItem ? 'Confirmation' : 'Prep'}: ${prep}`)
  if (serving) bits.push(`${isStayItem ? 'Capacity' : 'Serving'}: ${serving}`)
  if (spice) bits.push(`${isStayItem ? 'Level' : 'Spice'}: ${spice}`)
  const metaLine = bits.join(' · ')
  const topLine = [category, metaLine].filter(Boolean).join(' · ')

  if (!desc && !topLine && !detailTail) return null

  const clamp = density === 'compact' ? 'line-clamp-2' : 'line-clamp-3'
  const marginTop = density === 'compact' ? 'mt-0.5' : 'mt-1'

  return (
    <div className={marginTop}>
      {desc ? (
        <p className={`text-xs leading-snug text-[#5b5b5b] ${clamp}`}>{desc}</p>
      ) : null}
      {topLine ? (
        <p className="mt-0.5 text-[11px] leading-snug text-[#6b6b6b]">{topLine}</p>
      ) : null}
      {detailTail ? (
        <p className="mt-0.5 text-[10px] leading-snug text-amber-950/90">
          <span className="font-semibold">{isStayItem ? 'Amenities:' : 'Allergens:'}</span> {detailTail}
        </p>
      ) : null}
    </div>
  )
}

export default TouristCartItemMeta
