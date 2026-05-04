export const fetchMapboxDrivingRoute = async (origin, destination) => {
  const token = import.meta.env.VITE_MAPBOX_APIKEY
  if (!token) {
    throw new Error('Maps are not configured for this app.')
  }
  const { lng: oLng, lat: oLat } = origin
  const { lng: dLng, lat: dLat } = destination
  const coords = `${oLng},${oLat};${dLng},${dLat}`
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${encodeURIComponent(token)}&overview=simplified&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Could not calculate a driving route.')
  }
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) {
    throw new Error('No driving route was found.')
  }
  const geometry = route.geometry
  const coordinates =
    geometry?.type === 'LineString' && Array.isArray(geometry.coordinates) ? geometry.coordinates : []
  return {
    durationSeconds: route.duration,
    distanceMeters: route.distance,
    coordinates
  }
}

export const formatDrivingDistance = (meters) => {
  if (typeof meters !== 'number' || Number.isNaN(meters)) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`
}

export const formatDrivingDuration = (seconds) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '—'
  const m = Math.max(1, Math.round(seconds / 60))
  if (m < 60) return `~${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `~${h} hr ${rest} min` : `~${h} hr`
}
