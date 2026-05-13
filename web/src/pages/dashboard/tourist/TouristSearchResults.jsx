import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { FiArrowLeft, FiSearch } from 'react-icons/fi'
import TouristMenuItemDetailModal from '../../../components/tourist/explore/modals/TouristMenuItemDetailModal.jsx'
import { touristExploreHref, touristHomeHref } from '../../../components/layout/tourist/touristLayout.constants.js'
import { fetchPublicBusinessById } from '../../../services/tourist/touristExplore.service.js'
import { useTouristExploreStore } from '../../../store/tourist/touristExplore.store.js'
import { categoryDisplayLabel, categoryMatchesLabel } from '../../../shared/utils/touristExplore.utils.js'
import {
  menuFeedItemMatchesQuery,
  menuFeedItemTitleMatchesQuery,
  splitTitleForHighlight
} from '../../../shared/utils/touristSearchHighlight.utils.js'

const formatPrice = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ItemTitle = ({ item, query }) => {
  const parts = splitTitleForHighlight(String(item?.name || ''), query)
  const titleMatch = menuFeedItemTitleMatchesQuery(item, query.trim().toLowerCase())

  return (
    <p className={titleMatch ? 'line-clamp-2 text-sm text-[#1f1f1f]' : 'line-clamp-2 text-sm font-semibold text-[#1f1f1f]'}>
      {parts.map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-bold text-[#1f1f1f]">
            {seg.text}
          </strong>
        ) : (
          <span key={i} className={titleMatch ? 'font-medium' : ''}>
            {seg.text}
          </span>
        )
      )}
    </p>
  )
}

const catalogItemKey = (item) => `${String(item?.businessId || '')}-${String(item?.id || '')}`

const TouristSearchResults = () => {
  const [searchParams] = useSearchParams()
  const qRaw = String(searchParams.get('q') || '').trim()
  const needle = qRaw.toLowerCase()

  const [selectedItem, setSelectedItem] = useState(null)
  const [stayCatalogItems, setStayCatalogItems] = useState([])
  const [stayCatalogLoading, setStayCatalogLoading] = useState(false)
  const [stayCatalogError, setStayCatalogError] = useState('')

  const {
    businesses,
    isLoading: businessesLoading,
    menuFeedItems,
    menuFeedLoading,
    menuFeedError,
    loadMenuFeed,
    loadPublicBusinesses
  } = useTouristExploreStore(
    useShallow((s) => ({
      businesses: s.businesses,
      isLoading: s.isLoading,
      menuFeedItems: s.menuFeedItems,
      menuFeedLoading: s.menuFeedLoading,
      menuFeedError: s.menuFeedError,
      loadMenuFeed: s.loadMenuFeed,
      loadPublicBusinesses: s.loadPublicBusinesses
    }))
  )

  useEffect(() => {
    void loadPublicBusinesses()
  }, [loadPublicBusinesses])

  useEffect(() => {
    void loadMenuFeed('ALL')
  }, [loadMenuFeed])

  const stayBusinesses = useMemo(
    () =>
      businesses.filter(
        (business) =>
          categoryMatchesLabel(business?.category, 'Resort') || categoryMatchesLabel(business?.category, 'Hotel')
      ),
    [businesses]
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      if (!stayBusinesses.length) {
        setStayCatalogItems([])
        setStayCatalogError('')
        setStayCatalogLoading(false)
        return
      }
      setStayCatalogLoading(true)
      setStayCatalogError('')
      try {
        const responses = await Promise.all(
          stayBusinesses.map((business) => fetchPublicBusinessById(String(business?._id || '')))
        )
        if (cancelled) return
        const allPackages = []
        for (let i = 0; i < responses.length; i += 1) {
          const res = responses[i]
          const business = stayBusinesses[i]
          const businessData = res?.data?.data
          const businessId = String(businessData?._id || business?._id || '')
          const businessName = String(businessData?.name || business?.name || 'Stay')
          const partnerCategoryLabel = categoryDisplayLabel(business?.category)
          const menuItems = Array.isArray(businessData?.menuItems) ? businessData.menuItems : []
          for (const item of menuItems) {
            if (item?.isDeleted) continue
            if (!item?.isAvailable) continue
            if (String(item?.stockStatus || '').trim().toUpperCase() === 'OUT_OF_STOCK') continue
            allPackages.push({
              ...item,
              businessId,
              businessName,
              partnerCategoryLabel,
              listingType: 'STAY'
            })
          }
        }
        setStayCatalogItems(allPackages)
      } catch (err) {
        if (cancelled) return
        setStayCatalogItems([])
        setStayCatalogError(err?.response?.data?.message || err?.message || 'Could not load resort packages.')
      } finally {
        if (!cancelled) setStayCatalogLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [stayBusinesses])

  const mergedCatalogItems = useMemo(() => {
    const menu = Array.isArray(menuFeedItems) ? menuFeedItems : []
    const stays = stayBusinesses.length ? stayCatalogItems : []
    const byKey = new Map()
    for (const item of menu) {
      byKey.set(catalogItemKey(item), item)
    }
    for (const item of stays) {
      const k = catalogItemKey(item)
      if (!byKey.has(k)) byKey.set(k, item)
    }
    return Array.from(byKey.values())
  }, [menuFeedItems, stayCatalogItems, stayBusinesses])

  const stayRelevantLoading = stayBusinesses.length > 0 && stayCatalogLoading
  const businessesListLoading = businessesLoading && !businesses.length

  const rankedResults = useMemo(() => {
    if (!needle || !Array.isArray(mergedCatalogItems)) return []
    const hits = mergedCatalogItems.filter((item) => menuFeedItemMatchesQuery(item, needle))
    return [...hits].sort((a, b) => {
      const at = menuFeedItemTitleMatchesQuery(a, needle) ? 1 : 0
      const bt = menuFeedItemTitleMatchesQuery(b, needle) ? 1 : 0
      if (bt !== at) return bt - at
      return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' })
    })
  }, [mergedCatalogItems, needle])

  const listBlockingLoading =
    Boolean(qRaw) && !rankedResults.length && (menuFeedLoading || businessesListLoading || stayRelevantLoading)

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={touristExploreHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#9b5a2c] transition hover:text-[#c66b2b]"
          >
            <FiArrowLeft className="h-4 w-4" aria-hidden />
            Back to Explore
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#1f1f1f] md:text-3xl">Search catalog</h1>
          {qRaw ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#5b5b5b]">
              <FiSearch className="h-4 w-4 shrink-0 text-[#9b5a2c]" aria-hidden />
              <span>
                Results for <span className="font-semibold text-[#1f1f1f]">&quot;{qRaw}&quot;</span> — restaurant dishes,
                resort and hotel stay packages, and other catalog items (not partner profile cards).
              </span>
            </p>
          ) : (
            <p className="mt-2 max-w-2xl text-sm text-[#5b5b5b]">
              Add a search from the home hero to see matching menu items and packages here, or go back to Explore.
            </p>
          )}
        </div>
        <Link
          to={touristHomeHref}
          className="shrink-0 rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-medium text-[#1f1f1f] shadow-sm transition hover:border-[#d4c4b6]"
        >
          Home hub
        </Link>
      </div>

      {menuFeedError ? (
        <p className="rounded-xl border border-[#fecdca] bg-[#fff4f2] p-4 text-sm text-[#7a271a]">{menuFeedError}</p>
      ) : null}

      {stayCatalogError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{stayCatalogError}</p>
      ) : null}

      {listBlockingLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="animate-pulse overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f5eee4]">
              <div className="aspect-[4/3] bg-[#ece3d9]" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-[75%] rounded bg-[#ece3d9]" />
                <div className="h-3 w-1/2 rounded bg-[#ece3d9]" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!listBlockingLoading && qRaw && !rankedResults.length ? (
        <p className="rounded-xl border border-[#e7dfd5] bg-[#fbf9f6] p-6 text-sm text-[#5b5b5b]">
          No catalog items matched that search. Try different keywords or browse Explore by category.
        </p>
      ) : null}

      {!listBlockingLoading && !qRaw ? (
        <p className="rounded-xl border border-dashed border-[#e7dfd5] bg-white p-6 text-sm text-[#5b5b5b]">
          No search query in the address bar. Use the search bar on your home hub, then press Explore.
        </p>
      ) : null}

      {!listBlockingLoading && rankedResults.length > 0 ? (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {rankedResults.map((item) => {
            const img = Array.isArray(item.images) && item.images.length ? item.images[0] : null
            const showAvailable = Boolean(item.isAvailable) && item.stockStatus !== 'OUT_OF_STOCK'
            return (
              <li key={catalogItemKey(item)}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#e7dfd5] bg-[#f8f5f0] text-left shadow-sm transition hover:border-[#d4c4b6] hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ece3d9]">
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[#a79a8b]">
                        No photo
                      </div>
                    )}
                    {showAvailable ? (
                      <span className="absolute right-2 top-2 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                        Available
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <ItemTitle item={item} query={qRaw} />
                    <p className="text-xs text-[#5b5b5b]">{item.businessName}</p>
                    {item.category ? (
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9b5a2c]">{item.category}</p>
                    ) : null}
                    <p className="mt-auto pt-1 text-sm font-semibold text-[#ff7a1a]">{formatPrice(item.price)}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {selectedItem ? (
        <TouristMenuItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      ) : null}
    </div>
  )
}

export default TouristSearchResults
