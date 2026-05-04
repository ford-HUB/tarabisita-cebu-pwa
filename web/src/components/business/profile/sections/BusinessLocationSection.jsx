import { CoordinateInput } from '../ui'

const BusinessLocationSection = ({
  isEditing,
  mapboxToken,
  mapContainerRef,
  mapboxPreviewUrl,
  isLocating,
  locationError,
  location,
  onUseCurrentLocation,
  onOpenMapbox,
  onLocationChange
}) => {
  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Business location</p>
          <p className="mt-1 text-sm text-[#4f4f4f]">
            Default view shows a wider map. Edit Profile zooms in for precise marker updates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={!isEditing || isLocating}
            className="rounded-full border border-[#e7dfd5] px-3 py-1 text-xs font-medium text-[#3f3a35] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:bg-[#f5f1ea] disabled:text-[#9a8f82]"
          >
            {isLocating ? 'Locating...' : 'Auto Mark Current Location'}
          </button>
          <a
            href={mapboxPreviewUrl}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!mapboxToken}
            onClick={onOpenMapbox}
            className="rounded-full border border-[#e7dfd5] px-3 py-1 text-xs font-medium text-[#3f3a35] transition hover:bg-[#f5eee4]"
          >
            Open in Mapbox
          </a>
        </div>
      </div>
      {locationError && <p className="mt-2 text-xs text-[#b42318]">{locationError}</p>}

      <div className="mt-3 overflow-hidden rounded-xl border border-[#efe6dc]">
        {mapboxToken ? (
          <div ref={mapContainerRef} className="h-72 w-full" />
        ) : (
          <div className="flex h-72 items-center justify-center bg-[#f8f5ef] px-4 text-center text-sm text-[#5b5b5b]">
            Map preview unavailable. Add `VITE_MAPBOX_APIKEY` in `web/.env` to enable Mapbox.
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <CoordinateInput
          label="Latitude"
          value={location.lat}
          onChange={(event) => onLocationChange('lat', event.target.value)}
          disabled={!isEditing}
        />
        <CoordinateInput
          label="Longitude"
          value={location.lng}
          onChange={(event) => onLocationChange('lng', event.target.value)}
          disabled={!isEditing}
        />
      </div>
    </section>
  )
}

export default BusinessLocationSection
