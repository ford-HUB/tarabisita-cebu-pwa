import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import mapboxgl from 'mapbox-gl'
import { DEFAULT_LOCATION } from '../shared/constants/profile.constants'

export const useBusinessMap = ({ isEditing, location, setLocation, onAddressResolved }) => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_APIKEY
  const mapZoom = isEditing ? 17 : 13
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const isEditingRef = useRef(isEditing)
  const reverseGeocodeRequestRef = useRef(0)
  const onAddressResolvedRef = useRef(onAddressResolved)

  const mapboxPreviewUrl = useMemo(
    () =>
      mapboxToken
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=true&zoomwheel=true&access_token=${encodeURIComponent(
            mapboxToken
          )}&zoom=${mapZoom}&center=${location.lng},${location.lat}`
        : '#',
    [location.lng, location.lat, mapZoom, mapboxToken]
  )

  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    onAddressResolvedRef.current = onAddressResolved
  }, [onAddressResolved])

  const reverseGeocodeAddress = async (lat, lng) => {
    if (!mapboxToken) return
    const requestId = Date.now()
    reverseGeocodeRequestRef.current = requestId
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,place,locality,neighborhood&limit=1&access_token=${encodeURIComponent(
          mapboxToken
        )}`
      )
      if (!response.ok) return
      const data = await response.json()
      const nextAddress = data?.features?.[0]?.place_name
      if (!nextAddress || reverseGeocodeRequestRef.current !== requestId) return
      onAddressResolvedRef.current?.(nextAddress)
    } catch {
      // keep existing address when reverse geocoding fails
    }
  }

  const updateLocationAndAddress = ({ lat, lng }) => {
    const nextLat = Number(lat.toFixed(6))
    const nextLng = Number(lng.toFixed(6))
    setLocation({ lat: nextLat, lng: nextLng })
    if (isEditingRef.current) reverseGeocodeAddress(nextLat, nextLng)
  }

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return
    mapboxgl.accessToken = mapboxToken

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [Number(location.lng ?? DEFAULT_LOCATION.lng), Number(location.lat ?? DEFAULT_LOCATION.lat)],
      zoom: mapZoom
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const marker = new mapboxgl.Marker({
      color: '#ff7a1a',
      draggable: isEditingRef.current
    })
      .setLngLat([Number(location.lng ?? DEFAULT_LOCATION.lng), Number(location.lat ?? DEFAULT_LOCATION.lat)])
      .addTo(map)

    map.on('click', (event) => {
      if (!isEditingRef.current) return
      updateLocationAndAddress({ lat: event.lngLat.lat, lng: event.lngLat.lng })
    })

    marker.on('dragend', () => {
      if (!isEditingRef.current) return
      const lngLat = marker.getLngLat()
      updateLocationAndAddress({ lat: lngLat.lat, lng: lngLat.lng })
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      marker.remove()
      map.remove()
      markerRef.current = null
      mapRef.current = null
    }
  }, [mapboxToken])

  useEffect(() => {
    if (!markerRef.current) return
    markerRef.current.setLngLat([Number(location.lng), Number(location.lat)])
  }, [location.lng, location.lat])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setDraggable(isEditing)
    mapRef.current.flyTo({
      center: [Number(location.lng), Number(location.lat)],
      zoom: isEditing ? 17 : 13
    })
    const canvas = mapRef.current.getCanvas()
    if (canvas) canvas.style.cursor = isEditing ? 'crosshair' : 'grab'
  }, [isEditing, location.lng, location.lat])

  const handleLocationChange = (key, value) => {
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) return
    const nextLocation = { ...location, [key]: numericValue }
    updateLocationAndAddress({
      lat: Number(nextLocation.lat),
      lng: Number(nextLocation.lng)
    })
  }

  const handleUseCurrentLocation = () => {
    if (!isEditing || isLocating) return
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.')
      return
    }
    setIsLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocationAndAddress({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setIsLocating(false)
      },
      () => {
        setLocationError('Unable to get your current location. Please allow location permission.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleOpenMapbox = (event) => {
    if (mapboxToken) return
    event.preventDefault()
    toast.error('Mapbox token is missing. Set VITE_MAPBOX_APIKEY in web/.env.')
  }

  return {
    mapboxToken,
    mapContainerRef,
    mapboxPreviewUrl,
    isLocating,
    locationError,
    clearLocationError: () => setLocationError(''),
    handleLocationChange,
    handleUseCurrentLocation,
    handleOpenMapbox
  }
}
