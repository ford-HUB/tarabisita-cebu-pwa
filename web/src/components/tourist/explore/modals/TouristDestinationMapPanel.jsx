import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiExternalLink, FiMap, FiNavigation } from 'react-icons/fi'
import {
  fetchMapboxDrivingRoute,
  formatDrivingDistance,
  formatDrivingDuration
} from '../../../../shared/utils/mapboxDirections.utils.js'
import { buildMapboxStaticMapUrl, hasValidMapCoordinates } from '../../../../shared/utils/mapboxStaticMap.utils.js'
import { googleDirectionsUrl, googleSearchAddressUrl } from '../../../../shared/utils/touristMapLinks.utils.js'

const formatApproxLatLng = ({ lat, lng }) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '—'
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew}`
}

const TouristDestinationMapPanel = ({
  placeLabel,
  address,
  destination,
  requireEngagementStep = false,
  staticMapHeightClass = 'h-44 sm:h-48',
  compact = false
}) => {
  const [mapEngaged, setMapEngaged] = useState(!requireEngagementStep)
  const [userOrigin, setUserOrigin] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState(null)

  const coordsOk = hasValidMapCoordinates(destination)
  const routeCoordinates =
    routeInfo?.coordinates && Array.isArray(routeInfo.coordinates) && routeInfo.coordinates.length >= 2
      ? routeInfo.coordinates
      : null
  const routeDistanceMeters = Number(routeInfo?.distanceMeters) || 0

  const staticMapUrl = useMemo(() => {
    if (!coordsOk || !destination) return null
    const w = compact ? 440 : 640
    const h = compact ? 260 : 240
    const zoom = routeCoordinates ? 8.6 : userOrigin ? 9.2 : 11
    const fitPadding = routeCoordinates ? (routeDistanceMeters > 30_000 ? 110 : routeDistanceMeters > 12_000 ? 92 : 76) : 56
    return buildMapboxStaticMapUrl({
      lng: destination.lng,
      lat: destination.lat,
      width: w,
      height: h,
      zoom,
      routeCoordinates,
      userLocation: userOrigin,
      fitPadding
    })
  }, [coordsOk, destination, compact, routeCoordinates, userOrigin, routeDistanceMeters])

  const destLat = destination?.lat
  const destLng = destination?.lng
  const hasDestinationPin = Boolean(coordsOk && destLat != null && destLng != null)
  const canComputeEta = hasDestinationPin && Boolean(import.meta.env.VITE_MAPBOX_APIKEY)

  const runLocationAndRoute = useCallback(() => {
    if (!coordsOk || destLat == null || destLng == null) return
    const dest = { lat: destLat, lng: destLng }
    if (!import.meta.env.VITE_MAPBOX_APIKEY) {
      setRouteError('Maps key is not set. You can still open directions in Google Maps below.')
      return
    }
    if (!navigator.geolocation) {
      setRouteLoading(false)
      setRouteError('This browser does not support location.')
      return
    }
    setRouteLoading(true)
    setRouteError(null)
    setRouteInfo(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const origin = { lng: pos.coords.longitude, lat: pos.coords.latitude }
        setUserOrigin(origin)
        try {
          const r = await fetchMapboxDrivingRoute(origin, dest)
          setRouteInfo(r)
        } catch (e) {
          setRouteError(e?.message || 'Could not get route.')
        } finally {
          setRouteLoading(false)
        }
      },
      (err) => {
        setRouteLoading(false)
        if (err?.code === 1) {
          setRouteError(
            'Location was blocked. Allow location for this site in your browser settings, or use “Open directions” below.'
          )
        } else {
          setRouteError('Could not read your location. Try “Refresh estimate” or open directions below.')
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60_000 }
    )
  }, [coordsOk, destLat, destLng])

  useEffect(() => {
    setUserOrigin(null)
    setRouteInfo(null)
    setRouteError(null)
    setRouteLoading(false)
  }, [destLat, destLng, requireEngagementStep])

  useEffect(() => {
    const mayRun = canComputeEta && (!requireEngagementStep || mapEngaged)
    if (!mayRun) return
    let cancelled = false
    const t = window.setTimeout(() => {
      if (cancelled) return
      runLocationAndRoute()
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [canComputeEta, mapEngaged, requireEngagementStep, runLocationAndRoute, destLat, destLng])

  const mapsHref =
    coordsOk && destLat != null && destLng != null
      ? googleDirectionsUrl({ lat: destLat, lng: destLng }, userOrigin)
      : googleSearchAddressUrl(address)

  if (requireEngagementStep && !mapEngaged) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[#d4c4b6] bg-white px-4 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8f2] text-[#9b5a2c] ring-1 ring-[#ff7a1a]/25">
          <FiMap className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#1f1f1f]">Map &amp; travel time</p>
          <p className="mt-1 text-xs leading-relaxed text-[#5b5b5b]">
            Open the map to see the venue. We&apos;ll ask your browser for location once to estimate driving time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMapEngaged(true)
            setRouteError(null)
          }}
          className="rounded-full bg-[#ff7a1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6c12]"
        >
          View map
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a79a8b]">Location</p>
      {staticMapUrl ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="block shrink-0 overflow-hidden rounded-xl border border-[#e7dfd5] shadow-sm ring-1 ring-black/5 transition hover:ring-[#ff7a1a]/40"
        >
          <img
            key={staticMapUrl}
            src={staticMapUrl}
            alt={`Map preview near ${placeLabel}`}
            className={`w-full object-cover ${staticMapHeightClass}`}
            loading="lazy"
          />
          <span className="sr-only">Open directions in Google Maps</span>
        </a>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d4c4b6] bg-white px-3 py-5 text-center text-xs text-[#5b5b5b]">
          {import.meta.env.VITE_MAPBOX_APIKEY
            ? 'This place has no map pin yet. Use directions from the address when available.'
            : 'Map preview needs a Mapbox key in the app environment.'}
        </div>
      )}

      {userOrigin ? (
        <div className="rounded-md border border-[#efe6dc] bg-[#fbf9f6] px-2.5 py-1.5 text-[11px] leading-snug text-[#5b5b5b]">
          <p className="text-[#1f1f1f]">
            <span className="font-medium">You</span>{' '}
            <span className="font-mono text-[#5b5b5b]">{formatApproxLatLng(userOrigin)}</span>
          </p>
          {staticMapUrl ? (
            <p className="mt-0.5 text-[#6b6b6b]">
              <span className="mr-0.5 inline-block h-2 w-3 rounded-sm bg-[#2563eb] align-middle" aria-hidden /> you ·
              <span className="mx-0.5 inline-block h-2 w-3 rounded-sm bg-[#ff7a1a] align-middle" aria-hidden />
              {placeLabel}
              {routeCoordinates ? (
                <>
                  {' · '}
                  <span className="mx-0.5 inline-block h-0.5 w-4 rounded-sm bg-[#ff7a1a] align-middle" aria-hidden />
                  route
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {routeLoading && !routeInfo && !routeError ? (
        <p className="text-[11px] font-medium text-[#5b5b5b]">Getting route…</p>
      ) : null}

      {routeInfo ? (
        <p className="text-sm font-medium text-[#1f1f1f]">
          <span className="text-[#9b5a2c]">{formatDrivingDistance(routeInfo.distanceMeters)}</span>
          {' · '}
          <span className="text-[#9b5a2c]">{formatDrivingDuration(routeInfo.durationSeconds)}</span>
          {' drive (est.)'}
        </p>
      ) : null}
      {routeError ? <p className="text-[11px] text-red-800">{routeError}</p> : null}

      {hasDestinationPin && canComputeEta ? (
        <p className="text-[10px] leading-snug text-[#6b6b6b]">
          Location used here only for this route—not stored by Tara Bisita. Tap <span className="font-medium text-[#1f1f1f]">Allow</span> if the browser asks.
        </p>
      ) : hasDestinationPin && !import.meta.env.VITE_MAPBOX_APIKEY ? (
        <p className="text-[10px] leading-snug text-[#5b5b5b]">Enable maps for ETA. Directions link still works.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canComputeEta ? (
          <button
            type="button"
            disabled={routeLoading}
            onClick={() => runLocationAndRoute()}
            className="inline-flex h-9 min-w-0 flex-1 shrink-0 items-center justify-center gap-2 rounded-full bg-[#1f1f1f] px-3 text-xs font-semibold leading-tight text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60 sm:px-3.5 sm:text-[13px]"
          >
            <FiNavigation className="h-4 w-4 shrink-0" aria-hidden />
            {routeLoading ? 'Updating…' : 'Refresh estimate'}
          </button>
        ) : null}
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex h-9 min-w-0 shrink-0 items-center justify-center gap-2 rounded-full border border-[#e7dfd5] bg-white px-3 text-xs font-semibold leading-tight text-[#9b5a2c] transition hover:border-[#ff7a1a] hover:text-[#ff7a1a] sm:px-3.5 sm:text-[13px] ${canComputeEta ? 'flex-1' : 'w-full'}`}
        >
          Open directions
          <FiExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}

export default TouristDestinationMapPanel
