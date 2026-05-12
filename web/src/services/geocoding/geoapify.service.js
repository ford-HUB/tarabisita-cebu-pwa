const GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete'
const CEBU_PROVINCE_CENTER = { lon: 123.8915, lat: 10.3157 }
const CEBU_CITY_BBOX = [123.75, 10.24, 123.93, 10.5]
const DISALLOWED_RESULT_TYPES = new Set(['state', 'country'])

const resolveApiKey = () => import.meta.env.VITE_GEOAPIFY_APIKEY

const normalizeCityLabel = (value) => {
  const normalized = String(value || '').trim()
  if (/^city of cebu$/i.test(normalized)) {
    return 'Cebu City'
  }

  return normalized
}

const isSamePlaceName = (left, right) => {
  const normalizedLeft = normalizeCityLabel(left).toLowerCase()
  const normalizedRight = normalizeCityLabel(right).toLowerCase()

  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight
}

const isWithinCebuProvince = (properties) => {
  const sublevel = String(properties?.iso3166_2_sublevel || '').trim().toUpperCase()
  if (sublevel && sublevel !== 'PH-CEB') {
    return false
  }

  const state = String(properties?.state || '').trim().toLowerCase()
  if (state === 'cebu') {
    return true
  }

  const formatted = String(properties?.formatted || '').toLowerCase()
  const addressLine2 = String(properties?.address_line2 || '').toLowerCase()

  return /cebu/.test(formatted) || /cebu/.test(addressLine2)
}

const buildStreetLine = (properties) => {
  const housenumber = String(properties?.housenumber || '').trim()
  const street = String(properties?.street || '').trim()

  return [housenumber, street].filter(Boolean).join(' ').trim()
}

const buildRectFilter = (bbox) => {
  if (!Array.isArray(bbox) || bbox.length < 4) {
    return null
  }

  const [minLon, minLat, maxLon, maxLat] = bbox
  return `rect:${minLon},${minLat},${maxLon},${maxLat}`
}

const fetchAutocompleteFeatures = async ({ text, filter, apiKey }) => {
  const params = new URLSearchParams({
    text,
    apiKey,
    limit: '10',
    lang: 'en',
    bias: `proximity:${CEBU_PROVINCE_CENTER.lon},${CEBU_PROVINCE_CENTER.lat}`,
  })

  if (filter) {
    params.set('filter', filter)
  }

  const response = await fetch(`${GEOAPIFY_AUTOCOMPLETE_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Unable to search cities right now.')
  }

  const payload = await response.json()
  return Array.isArray(payload?.features) ? payload.features : []
}

const mapGeocodeSuggestion = (feature) => {
  const properties = feature?.properties || {}
  const resultType = String(properties?.result_type || '').trim().toLowerCase()

  if (DISALLOWED_RESULT_TYPES.has(resultType) || !isWithinCebuProvince(properties)) {
    return null
  }

  const city = normalizeCityLabel(properties.city)
  const county = normalizeCityLabel(properties.county)
  const suburb = String(properties.suburb || '').trim()
  const village = String(properties.village || '').trim()
  const district = String(properties.district || '').trim()
  const neighbourhood = String(properties.neighbourhood || '').trim()
  const addressLine1 = String(properties.address_line1 || '').trim()
  const label = String(properties.formatted || '').trim()
  const street = buildStreetLine(properties)
  const coordinates = Array.isArray(feature?.geometry?.coordinates)
    ? feature.geometry.coordinates
    : []

  let resolvedCity = city || county
  let resolvedDistrict = suburb || village || district || neighbourhood

  if (!resolvedDistrict && resultType === 'suburb' && addressLine1) {
    resolvedDistrict = addressLine1
  }

  if (resolvedCity && resolvedDistrict && isSamePlaceName(resolvedCity, resolvedDistrict)) {
    resolvedDistrict = ''
  }

  if (!resolvedCity && resolvedDistrict) {
    resolvedCity = resolvedDistrict
    resolvedDistrict = ''
  }

  if (!resolvedCity) {
    return null
  }

  return {
    id: String(properties.place_id || `${coordinates[0] || ''}:${coordinates[1] || ''}:${label}`),
    city: resolvedCity,
    district: resolvedDistrict,
    street,
    label: label || [resolvedCity, resolvedDistrict, street].filter(Boolean).join(', '),
    distance: Number(properties.distance ?? Number.POSITIVE_INFINITY),
  }
}

const buildSuggestionKey = (suggestion) => {
  const city = String(suggestion.city || '').trim().toLowerCase()
  const district = String(suggestion.district || '').trim().toLowerCase()
  const street = String(suggestion.street || '').trim().toLowerCase()

  return `${city}|${district}|${street}`
}

const mergeSuggestions = (features) => {
  const suggestions = new Map()

  for (const feature of features) {
    const suggestion = mapGeocodeSuggestion(feature)
    if (!suggestion) continue

    const suggestionKey = buildSuggestionKey(suggestion)
    const normalizedSuggestion = {
      ...suggestion,
      id: suggestionKey,
    }
    const existing = suggestions.get(suggestionKey)

    if (!existing || normalizedSuggestion.distance < existing.distance) {
      suggestions.set(suggestionKey, normalizedSuggestion)
    }
  }

  return Array.from(suggestions.values()).sort((left, right) => left.distance - right.distance)
}

const collectDistrictBboxes = (features) => {
  const bboxes = new Set()

  for (const feature of features) {
    const bbox = feature?.bbox
    const rectFilter = buildRectFilter(bbox)
    if (rectFilter) {
      bboxes.add(rectFilter)
    }
  }

  bboxes.add(buildRectFilter(CEBU_CITY_BBOX))

  return Array.from(bboxes)
}

export const searchCebuCities = async (query) => {
  const apiKey = resolveApiKey()
  const normalizedQuery = String(query || '').trim()

  if (!apiKey || normalizedQuery.length < 2) {
    return []
  }

  const provinceFeatures = await fetchAutocompleteFeatures({
    text: `${normalizedQuery}, Cebu, Philippines`,
    filter: 'countrycode:ph',
    apiKey,
  })

  const districtFilters = collectDistrictBboxes(provinceFeatures)
  const districtFeatureGroups = await Promise.all(
    districtFilters.map((filter) =>
      fetchAutocompleteFeatures({
        text: normalizedQuery,
        filter,
        apiKey,
      })
    )
  )

  return mergeSuggestions([...provinceFeatures, ...districtFeatureGroups.flat()])
}
