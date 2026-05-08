import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiImage,
  FiMessageCircle,
  FiMinus,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiStar,
} from 'react-icons/fi'
import { toast } from 'sonner'
import {
  buildTouristStoreMessagingHref,
  touristCheckoutHref,
  touristExploreHref,
  touristStayBookingHref
} from '../../../components/layout/tourist/touristLayout.constants.js'
import {
  fetchPublicBusinessById,
  recordPublicBusinessView
} from '../../../services/tourist/touristExplore.service.js'
import { postStoreMessagingLinkToken } from '../../../services/tourist/store-messaging.service.js'
import { useTouristCartItemStore } from '../../../store/tourist/tourist-cart-item.store.js'
import TouristDestinationMapPanel from '../../../components/tourist/explore/modals/TouristDestinationMapPanel.jsx'
import TouristStayPackageDetailModal from '../../../components/tourist/explore/modals/TouristStayPackageDetailModal.jsx'
import { pickCartItemDetailsFromMenuItem } from '../../../shared/utils/tourist-cart-item-details.utils.js'
import { hasValidMapCoordinates } from '../../../shared/utils/mapboxStaticMap.utils.js'
import { googleDirectionsUrl, googleSearchAddressUrl } from '../../../shared/utils/touristMapLinks.utils.js'
import { categoryDisplayLabel, categoryMatchesLabel } from '../../../shared/utils/touristExplore.utils.js'

const heroImg = (business) => business?.banner || business?.coverImage || business?.logo

const formatPrice = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '₱0'
  return `₱ ${num.toLocaleString('en-PH')}`
}

const formatRating = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '5'
  return num.toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const getMenuCategories = (menuItems) => {
  const map = new Map()
  for (const item of menuItems || []) {
    const key = String(item?.category || 'More items').trim() || 'More items'
    map.set(key, (map.get(key) || 0) + 1)
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
}

const groupByCategory = (items) => {
  const map = new Map()
  for (const item of items || []) {
    const key = String(item?.category || 'More items').trim() || 'More items'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return Array.from(map.entries()).map(([name, rows]) => ({ name, rows }))
}

const MenuTabs = ({
  selected,
  onSelect,
  categories,
  stickyTopOffset = 0,
  searchTerm = '',
  onSearchTermChange
}) => {
  const scrollerRef = useRef(null)

  const scrollTabs = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.7)
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <div className="sticky z-20 border-b border-[#ececec] bg-white" style={{ top: `${stickyTopOffset}px` }}>
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="hidden w-full max-w-[210px] items-center rounded-full border border-[#ebebeb] bg-[#f8f8f8] px-3 py-1.5 md:flex">
          <FiSearch className="h-3.5 w-3.5 text-[#868686]" aria-hidden />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange?.(e.target.value)}
            placeholder="Search in menu"
            className="ml-2 w-full bg-transparent text-xs text-[#242424] outline-hidden placeholder:text-[#8f8f8f]"
          />
        </div>
        <button
          type="button"
          onClick={() => scrollTabs(-1)}
          aria-label="Scroll menu categories left"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#4b4b4b]"
        >
          <FiChevronLeft className="h-3.5 w-3.5" aria-hidden />
        </button>
        <div
          ref={scrollerRef}
          className="flex min-w-0 flex-1 gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelect(cat.name)}
              className={`shrink-0 border-b-2 py-2 text-[13px] font-medium ${
                selected === cat.name
                  ? 'border-[#212121] text-[#1f1f1f]'
                  : 'border-transparent text-[#6d6d6d] hover:text-[#222]'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scrollTabs(1)}
          aria-label="Scroll menu categories right"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#4b4b4b]"
        >
          <FiChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

const StoreLocationModal = ({ isOpen, onClose, businessName, address, destination }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close map modal" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-[#e7dfd5] bg-white shadow-2xl">
        <div className="border-b border-[#efefef] px-4 py-3 sm:px-5">
          <p className="text-base font-semibold text-[#1f1f1f]">Store map</p>
          <p className="mt-0.5 text-xs text-[#666]">{businessName}</p>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-5">
          <TouristDestinationMapPanel
            placeLabel={businessName}
            address={address}
            destination={destination}
            requireEngagementStep={false}
            staticMapHeightClass="h-60 sm:h-72"
          />
        </div>
        <div className="border-t border-[#efefef] px-4 py-3 text-right sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const BusinessDetail = () => {
  const { businessId } = useParams()
  const navigate = useNavigate()
  const addItem = useTouristCartItemStore((s) => s.addItem)
  const cartItems = useTouristCartItemStore((s) => s.items)
  const setItemQty = useTouristCartItemStore((s) => s.setItemQty)
  const removeItem = useTouristCartItemStore((s) => s.removeItem)

  const [business, setBusiness] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [menuSearchTerm, setMenuSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isOpeningMessage, setIsOpeningMessage] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [stickyTopOffset, setStickyTopOffset] = useState(0)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)

  useEffect(() => {
    setSelectedCategory('All')
    setMenuSearchTerm('')
    setSelectedPackageId('')
    setIsPackageModalOpen(false)
  }, [businessId])

  useEffect(() => {
    const updateStickyOffset = () => {
      const topbar = document.querySelector('header')
      const next = topbar instanceof HTMLElement ? Math.round(topbar.getBoundingClientRect().height) : 0
      setStickyTopOffset(next)
    }
    updateStickyOffset()
    window.addEventListener('resize', updateStickyOffset)
    return () => {
      window.removeEventListener('resize', updateStickyOffset)
    }
  }, [])

  useEffect(() => {
    if (!businessId) return
    let cancelled = false
    setIsLoading(true)
    setErrorMessage('')

    void fetchPublicBusinessById(String(businessId))
      .then((res) => {
        if (cancelled) return
        const data = res?.data?.data
        setBusiness(data && typeof data === 'object' ? data : null)
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.response?.data?.message || err?.message || 'Could not load this business.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    void recordPublicBusinessView(String(businessId)).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [businessId])

  const menuItems = useMemo(() => (Array.isArray(business?.menuItems) ? business.menuItems : []), [business?.menuItems])
  const availableStayPackages = useMemo(
    () =>
      menuItems.filter((item) => {
        if (item?.isDeleted) return false
        if (!item?.isAvailable) return false
        return String(item?.stockStatus || '').trim().toUpperCase() !== 'OUT_OF_STOCK'
      }),
    [menuItems]
  )
  const isStayBusiness = useMemo(
    () => categoryMatchesLabel(business?.category, 'Resort') || categoryMatchesLabel(business?.category, 'Hotel'),
    [business?.category]
  )
  const categories = useMemo(() => {
    const dynamic = getMenuCategories(menuItems)
    const total = dynamic.reduce((sum, entry) => sum + entry.count, 0)
    return [{ name: 'All', count: total }, ...dynamic]
  }, [menuItems])

  const filteredMenuItems = useMemo(() => {
    let rows = menuItems
    if (selectedCategory !== 'All') {
      rows = rows.filter((item) => String(item?.category || 'More items').trim() === selectedCategory)
    }
    const query = menuSearchTerm.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((item) => {
      const text = [item?.name, item?.description, item?.category].map((v) => String(v || '').toLowerCase()).join(' ')
      return text.includes(query)
    })
  }, [menuItems, selectedCategory, menuSearchTerm])

  const groupedMenuItems = useMemo(() => groupByCategory(filteredMenuItems), [filteredMenuItems])
  const displayGroups = useMemo(
    () => (selectedCategory === 'All' ? groupedMenuItems : groupedMenuItems.filter((g) => g.name === selectedCategory)),
    [groupedMenuItems, selectedCategory]
  )
  const selectedPackage = useMemo(() => {
    if (!isStayBusiness || !availableStayPackages.length) return null
    const firstPackage = availableStayPackages[0] || null
    if (!selectedPackageId) return firstPackage
    return availableStayPackages.find((item) => String(item?.id || '') === selectedPackageId) || firstPackage
  }, [isStayBusiness, availableStayPackages, selectedPackageId])

  const businessCartItems = useMemo(
    () => cartItems.filter((it) => String(it.businessId) === String(business?._id || '')),
    [cartItems, business?._id]
  )
  const cartSubtotal = useMemo(
    () => businessCartItems.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.qty) || 0), 0),
    [businessCartItems]
  )
  const cartCount = useMemo(() => businessCartItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0), [businessCartItems])

  const img = heroImg(business)
  const logo = business?.logo || img
  const categoryLabel = categoryDisplayLabel(business?.category)
  const listingLabel = isStayBusiness ? 'Stay List' : 'Restaurant List'
  const businessName = business?.name || 'Restaurant'
  const rating = formatRating(business?.averageRating || business?.rating)
  const ratingCount = Number(business?.ratingCount || business?.reviewsCount || business?.reviewCount || 1000)
  const sidebarStickyTop = stickyTopOffset + 8
  const destination = hasValidMapCoordinates(business?.businessLocation)
    ? { lat: business.businessLocation.lat, lng: business.businessLocation.lng }
    : null
  const directionHref = destination
    ? googleDirectionsUrl(destination)
    : googleSearchAddressUrl(business?.address || businessName)

  const handleOpenMessage = async () => {
    const id = business?._id ? String(business._id) : ''
    if (!id) {
      toast.error('Store details are still loading. Please try again.')
      return
    }
    setIsOpeningMessage(true)
    try {
      const res = await postStoreMessagingLinkToken({ businessId: id })
      const token = res?.data?.data?.messagingToken
      if (!token) throw new Error('NO_TOKEN')
      navigate(`/${buildTouristStoreMessagingHref(token)}`)
    } catch {
      toast.error('Could not open message. Please try again.')
    } finally {
      setIsOpeningMessage(false)
    }
  }

  if (isLoading && !business) {
    return (
      <div className="mx-auto max-w-[1300px] space-y-4 pb-8">
        <div className="animate-pulse rounded-xl border border-[#ededed] bg-white p-4">
          <div className="h-20 rounded-lg bg-[#efefef]" />
        </div>
        <div className="animate-pulse rounded-xl border border-[#ededed] bg-white p-4">
          <div className="h-9 rounded bg-[#efefef]" />
          <div className="mt-4 h-56 rounded bg-[#efefef]" />
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#fecdca] bg-[#fff4f2] p-8 text-center text-[#7a271a] shadow-sm">
        <h1 className="text-xl font-semibold text-[#1f1f1f]">Business not available</h1>
        <p className="mt-2 text-sm text-[#b42318]">{errorMessage || 'This listing may have been removed or is no longer public.'}</p>
        <button
          type="button"
          onClick={() => navigate(touristExploreHref)}
          className="mt-5 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6c12]"
        >
          Back to Explore
        </button>
      </div>
    )
  }

  const selectedPackageWithBusiness = selectedPackage
    ? {
        ...selectedPackage,
        businessId: String(business._id),
        businessName: business.name
      }
    : null

  const handleBookSelectedPackage = () => {
    if (!selectedPackageWithBusiness) return
    setIsPackageModalOpen(false)
    navigate(touristStayBookingHref, {
      state: {
        stayPackage: selectedPackageWithBusiness,
        stayBusiness: {
          _id: String(business._id),
          name: business.name,
          addOns: business?.addOns
        }
      }
    })
  }

  const handleAddSelectedPackageToCart = () => {
    if (!selectedPackageWithBusiness) return
    const image = Array.isArray(selectedPackageWithBusiness.images) && selectedPackageWithBusiness.images.length
      ? selectedPackageWithBusiness.images[0]
      : ''
    addItem({
      businessId: selectedPackageWithBusiness.businessId,
      businessName: selectedPackageWithBusiness.businessName,
      catalogItemId: String(selectedPackageWithBusiness.id || ''),
      name: selectedPackageWithBusiness.name || 'Stay package',
      unitPrice: Number(selectedPackageWithBusiness.price) || 0,
      image,
      qty: 1,
      listingType: 'STAY',
      ...pickCartItemDetailsFromMenuItem(selectedPackageWithBusiness)
    })
    setIsPackageModalOpen(false)
  }

  return (
    <div className="mx-auto max-w-[1320px] pb-8">
      <div className="mb-3 flex items-center gap-2 text-xs text-[#666]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[#444] hover:bg-[#f4f4f4]"
        >
          <FiArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </button>
        <span>{listingLabel}</span>
        <span>›</span>
        <span className="font-medium text-[#2b2b2b]">{businessName}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ededed] bg-white">
        <div className="border-b border-[#efefef] px-4 py-4 md:px-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#ececec] bg-[#f5f5f5]">
                {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#8a8a8a]">{categoryLabel}</p>
                <h1 className="truncate text-3xl font-semibold leading-tight text-[#1f1f1f]">{businessName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#555]">
                  <span className="inline-flex items-center gap-1">
                    <FiStar className="h-3.5 w-3.5 text-[#f59f0b]" aria-hidden />
                    {rating}/5 ({ratingCount.toLocaleString('en-PH')}+) · See reviews
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiInfo className="h-3.5 w-3.5" aria-hidden />
                    More Info
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenMessage}
              disabled={isOpeningMessage}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8d8d8] bg-white px-4 text-sm font-medium text-[#262626] transition hover:bg-[#fafafa] disabled:opacity-60"
            >
              <FiMessageCircle className="h-4 w-4" aria-hidden />
              {isOpeningMessage ? 'Opening…' : 'inqiure'}
            </button>
          </div>
        </div>

        <div className="border-b border-[#efefef] px-4 py-5 md:px-5">
          <p className="mb-3 text-[28px] font-semibold leading-none text-[#242424]">Store Located</p>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="min-w-[220px] rounded-lg bg-[#1f2530] p-3 text-left text-white transition hover:brightness-110"
            >
              <p className="text-sm font-semibold">View Map</p>
              <p className="mt-1 text-xs text-white/85">Open map with route and ETA minutes</p>
            </button>
            <a
              href={directionHref}
              target="_blank"
              rel="noreferrer"
              className="block min-w-[220px] rounded-lg bg-[#f5f5f5] p-3 transition hover:bg-[#ebebeb]"
            >
              <p className="text-sm font-semibold text-[#2b2b2b]">Make me a direction</p>
              <p className="mt-1 text-xs text-[#666]">Open Google Maps driving directions</p>
            </a>
          </div>
        </div>

        {isStayBusiness ? (
          <div className="border-b border-[#efefef] px-4 py-4 md:px-5">
            <div className="relative h-52 overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f1f1f1] sm:h-64">
              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : null}
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{categoryLabel}</p>
                <h2 className="mt-1 text-3xl leading-tight font-semibold sm:text-5xl">{String(businessName || '').toUpperCase()}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-white/90">
                  {business?.description || 'Curated stay experiences with relaxing views and resort comfort.'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {isStayBusiness ? null : (
          <MenuTabs
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            categories={categories}
            stickyTopOffset={stickyTopOffset}
            searchTerm={menuSearchTerm}
            onSearchTermChange={setMenuSearchTerm}
          />
        )}

        {isStayBusiness ? (
          <div className="grid gap-4 bg-white px-4 py-4 md:px-5">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-[#242424]">Stay Packages</h2>
                <p className="text-xs text-[#666]">Select a card to open package details</p>
              </div>
              {!availableStayPackages.length ? (
                <div className="rounded-lg border border-dashed border-[#dedede] bg-[#fafafa] p-8 text-center text-sm text-[#5c5c5c]">
                  No available stay packages for booking yet.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {availableStayPackages.map((item) => {
                    const id = String(item?.id || '')
                    const image = Array.isArray(item.images) && item.images.length ? item.images[0] : ''
                    const isSelected = String(selectedPackage?.id || '') === id
                    return (
                      <article
                        key={id}
                        className={`overflow-hidden rounded-xl border bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition ${
                          isSelected ? 'border-[#222] ring-1 ring-[#222]/10' : 'border-[#e9e9e9]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPackageId(id)
                            setIsPackageModalOpen(true)
                          }}
                          className="w-full text-left"
                        >
                          <div className="mb-2 h-32 w-full overflow-hidden rounded-md bg-[#f1f1f1]">
                            {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                          </div>
                          <h3 className="line-clamp-1 text-base font-semibold text-[#222]">{item.name}</h3>
                          <p className="mt-0.5 text-sm text-[#444]">from {formatPrice(item.price)}</p>
                          {item.description ? (
                            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#666]">{item.description}</p>
                          ) : null}
                          <div className="mt-2">
                            <span className="inline-flex rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold text-white">
                              Book
                            </span>
                          </div>
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-0 lg:h-[calc(100vh-220px)] lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden">
            <div className="min-w-0 bg-white px-4 py-4 md:px-5 lg:h-full lg:overflow-y-auto lg:pr-4">
              {!displayGroups.length ? (
                <div className="rounded-lg border border-dashed border-[#dedede] bg-[#fafafa] p-8 text-center text-sm text-[#5c5c5c]">
                  No menu items found for this filter.
                </div>
              ) : null}

              {displayGroups.map((group) => (
                <section key={group.name} className="mb-7">
                  <h2 className="mb-1 text-[32px] font-semibold leading-tight text-[#232323]">{group.name}</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.rows.map((item) => {
                      const image = Array.isArray(item.images) && item.images.length ? item.images[0] : ''
                      return (
                        <article
                          key={item.id}
                          className="relative overflow-hidden rounded-xl border border-[#e9e9e9] bg-white p-3 pr-11 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        >
                          <div className="flex gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-base font-semibold text-[#222]">{item.name}</h3>
                              <p className="mt-0.5 text-sm text-[#444]">from {formatPrice(item.price)}</p>
                              {item.description ? (
                                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#666]">{item.description}</p>
                              ) : null}
                            </div>
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#f1f1f1]">
                              {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              addItem({
                                businessId: String(business._id),
                                businessName: business.name,
                                catalogItemId: String(item.id),
                                name: item.name,
                                unitPrice: Number(item.price) || 0,
                                image,
                                qty: 1,
                                ...pickCartItemDetailsFromMenuItem(item)
                              })
                            }
                            className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfdfdf] bg-white text-[#232323] shadow-sm transition hover:bg-[#f6f6f6]"
                            aria-label={`Add ${item.name} to cart`}
                          >
                            <FiPlus className="h-4 w-4" aria-hidden />
                          </button>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>

            <aside
              className="border-l border-[#efefef] bg-white p-3 md:p-4 lg:sticky lg:h-full lg:self-start"
              style={{ top: `${sidebarStickyTop}px` }}
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-3 overflow-hidden rounded-lg border border-[#ececec]">
                  <div className="text-sm">
                    <button type="button" className="w-full bg-gray-50 px-3 py-2.5 font-medium text-[#242424]">
                      Chart
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {!businessCartItems.length ? (
                    <div className="rounded-lg border border-[#efefef] bg-[#fafafa] px-4 py-8 text-center">
                      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f0f0] text-[#9b9b9b]">
                        <FiShoppingBag className="h-6 w-6" aria-hidden />
                      </div>
                      <p className="text-xl font-semibold text-[#242424]">your carts</p>
                      <p className="mt-1 text-sm text-[#666]">You haven&apos;t added anything to your cart!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {businessCartItems.map((it) => (
                        <div key={it.key} className="rounded-lg border border-[#ececec] p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-medium text-[#222]">{it.name}</p>
                            <button
                              type="button"
                              onClick={() => removeItem(it.key)}
                              className="text-xs text-[#b74747] hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-md border border-[#e6e6e6]">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextQty = Number(it.qty || 1) - 1
                                  if (nextQty <= 0) {
                                    removeItem(it.key)
                                    return
                                  }
                                  setItemQty(it.key, nextQty)
                                }}
                                className="px-2 py-1 text-[#555]"
                              >
                                <FiMinus className="h-3.5 w-3.5" aria-hidden />
                              </button>
                              <span className="px-2 text-sm font-medium text-[#242424]">{it.qty}</span>
                              <button
                                type="button"
                                onClick={() => setItemQty(it.key, Math.min(99, Number(it.qty || 1) + 1))}
                                className="px-2 py-1 text-[#555]"
                              >
                                <FiPlus className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </div>
                            <p className="text-sm font-semibold text-[#1f1f1f]">{formatPrice((Number(it.unitPrice) || 0) * (Number(it.qty) || 0))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-[#efefef] pt-3">
                  <div className="flex items-center justify-between text-sm text-[#595959]">
                    <span>Total (incl. fees and tax)</span>
                    <span className="text-lg font-semibold text-[#1f1f1f]">{formatPrice(cartSubtotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(touristCheckoutHref)}
                    disabled={!cartCount}
                    className="mt-3 w-full rounded-md bg-[#e0e0e0] px-4 py-2.5 text-sm font-semibold text-[#4a4a4a] transition enabled:bg-[#222] enabled:text-white enabled:hover:bg-black disabled:cursor-not-allowed"
                  >
                    {cartCount ? 'Review payment and address' : 'Add items to continue'}
                  </button>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#666]">
                    <FiShoppingCart className="h-3.5 w-3.5" aria-hidden />
                    {cartCount} item{cartCount === 1 ? '' : 's'} in cart
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
      <StoreLocationModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        businessName={businessName}
        address={business?.address}
        destination={destination}
      />
      <TouristStayPackageDetailModal
        open={isStayBusiness && isPackageModalOpen}
        item={selectedPackageWithBusiness}
        onClose={() => setIsPackageModalOpen(false)}
        onAddToCart={handleAddSelectedPackageToCart}
        onBookNow={handleBookSelectedPackage}
      />
    </div>
  )
}

export default BusinessDetail
