/**
 * @param {{
 *   eyebrow?: string,
 *   title?: string,
 *   description?: string
 * }} [props]
 */
const TouristOrdersHeaderSection = ({
  eyebrow = 'Your activity',
  title = 'Orders',
  description = 'Track food and table orders you place with Tara Bisita partners. When you order from a restaurant, it will show up here.'
}) => {
  return (
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#9b5a2c]">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-tight text-[#1f1f1f] md:text-3xl">{title}</h1>
      <p className="max-w-2xl text-sm text-[#5b5b5b] md:text-base">{description}</p>
    </header>
  )
}

export default TouristOrdersHeaderSection
