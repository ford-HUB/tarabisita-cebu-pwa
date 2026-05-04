export const googleDirectionsUrl = (destination, origin) => {
  const d = `${destination.lat},${destination.lng}`
  if (origin) {
    const o = `${origin.lat},${origin.lng}`
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=driving`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d)}&travelmode=driving`
}

export const googleSearchAddressUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`
