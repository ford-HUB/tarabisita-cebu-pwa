const encodeSignedNumber = (num) => {
  let sgnNum = num << 1
  if (num < 0) {
    sgnNum = ~sgnNum
  }
  let chunk = ''
  while (sgnNum >= 0x20) {
    chunk += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63)
    sgnNum >>= 5
  }
  chunk += String.fromCharCode(sgnNum + 63)
  return chunk
}

export const encodePolyline5 = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return ''
  const valid = coordinates.filter(
    (c) => c && Number.isFinite(c[0]) && Number.isFinite(c[1])
  )
  if (valid.length < 2) return ''
  const precision = 5
  const factor = 10 ** precision
  let previousLat = 0
  let previousLng = 0
  let result = ''
  for (let i = 0; i < valid.length; i += 1) {
    const lng = valid[i][0]
    const lat = valid[i][1]
    const latRounded = Math.round(lat * factor)
    const lngRounded = Math.round(lng * factor)
    const dLat = latRounded - previousLat
    const dLng = lngRounded - previousLng
    previousLat = latRounded
    previousLng = lngRounded
    result += encodeSignedNumber(dLat) + encodeSignedNumber(dLng)
  }
  return result
}

export const buildMapboxStaticMapUrl = ({
  lng,
  lat,
  width = 640,
  height = 220,
  zoom = 12,
  routeCoordinates = null,
  userLocation = null,
  fitPadding = 48
}) => {
  const token = import.meta.env.VITE_MAPBOX_APIKEY
  if (!token || !Number.isFinite(lng) || !Number.isFinite(lat)) return null

  const base = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static'
  const w = Math.round(width)
  const h = Math.round(height)
  const size = `${w}x${h}@2x`
  const tokenQs = `access_token=${encodeURIComponent(token)}`

  const userOk =
    userLocation &&
    Number.isFinite(userLocation.lng) &&
    Number.isFinite(userLocation.lat)

  const polyline =
    Array.isArray(routeCoordinates) && routeCoordinates.length >= 2
      ? encodePolyline5(routeCoordinates)
      : ''

  if (userOk && polyline) {
    const pathOverlay = `path-6+ff7a1a-0.95(${encodeURIComponent(polyline)})`
    const destPin = `pin-s+ff7a1a(${lng},${lat})`
    const userPin = `pin-s+2563eb(${userLocation.lng},${userLocation.lat})`
    const overlays = `${pathOverlay},${destPin},${userPin}`
    return `${base}/${overlays}/auto/${size}?padding=${Math.max(16, Math.round(fitPadding))}&${tokenQs}`
  }

  if (userOk) {
    const destPin = `pin-s+ff7a1a(${lng},${lat})`
    const userPin = `pin-s+2563eb(${userLocation.lng},${userLocation.lat})`
    const overlays = `${destPin},${userPin}`
    return `${base}/${overlays}/auto/${size}?padding=${Math.max(16, Math.round(fitPadding))}&${tokenQs}`
  }

  const pin = `pin-s+ff7a1a(${lng},${lat})`
  const center = `${lng},${lat},${zoom},0`
  return `${base}/${pin}/${center}/${size}?${tokenQs}`
}

export const hasValidMapCoordinates = (loc) =>
  loc &&
  typeof loc.lat === 'number' &&
  typeof loc.lng === 'number' &&
  Number.isFinite(loc.lat) &&
  Number.isFinite(loc.lng) &&
  !(loc.lat === 0 && loc.lng === 0)
