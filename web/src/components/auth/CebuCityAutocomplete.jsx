import { useEffect, useId, useRef, useState } from 'react'
import { searchCebuCities } from '../../services/geocoding/geoapify.service'

const CITY_SEARCH_DEBOUNCE_MS = 400

const CebuCityAutocomplete = ({
  value,
  onChange,
  onSelectSuggestion,
  inputClassName,
  errorTextClassName,
  errorMessage,
  shouldShowError,
}) => {
  const listboxId = useId()
  const containerRef = useRef(null)
  const latestSearchIdRef = useRef(0)
  const lastSuggestionsRef = useRef([])
  const committedValueRef = useRef('')
  const isSelectingRef = useRef(false)
  const pendingBlurValidationRef = useRef(false)
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    const trimmed = String(value || '').trim()

    if (trimmed.length < 2) {
      lastSuggestionsRef.current = []
      setSuggestions([])
      setIsLoading(false)
      setSearchError('')
      setIsOpen(false)
      return undefined
    }

    if (committedValueRef.current === trimmed) {
      setSuggestions([])
      setIsOpen(false)
      setSearchError('')
      setIsLoading(false)
      return undefined
    }

    const searchId = latestSearchIdRef.current + 1
    latestSearchIdRef.current = searchId
    setIsLoading(true)
    setSearchError('')

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchCebuCities(trimmed)
        if (latestSearchIdRef.current !== searchId) return

        lastSuggestionsRef.current = results
        setSuggestions(results)

        if (committedValueRef.current === trimmed) {
          setIsOpen(false)
          setSearchError('')
          return
        }

        setIsOpen(results.length > 0)
        setSearchError(results.length === 0 ? 'No matching cities found in Cebu province.' : '')
      } catch {
        if (latestSearchIdRef.current !== searchId) return

        lastSuggestionsRef.current = []
        setSuggestions([])
        setIsOpen(false)
        setSearchError('Unable to load city suggestions right now.')
      } finally {
        if (latestSearchIdRef.current === searchId) {
          setIsLoading(false)
        }
      }
    }, CITY_SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [value])

  const matchesSuggestion = (inputValue, results) => {
    const normalizedInput = String(inputValue || '').trim().toLowerCase()
    if (!normalizedInput) return false

    return results.some((suggestion) => {
      const city = String(suggestion.city || '').trim().toLowerCase()
      const district = String(suggestion.district || '').trim().toLowerCase()

      return city === normalizedInput || district === normalizedInput
    })
  }

  const clearInvalidCity = () => {
    committedValueRef.current = ''
    lastSuggestionsRef.current = []
    onChange('')
    onSelectSuggestion?.({ city: '', district: '', street: '' })
    setSuggestions([])
    setIsOpen(false)
    setSearchError('')
  }

  const validateBlurredValue = () => {
    pendingBlurValidationRef.current = false

    const trimmed = String(value || '').trim()
    if (!trimmed) {
      return
    }

    if (committedValueRef.current === trimmed) {
      return
    }

    if (!matchesSuggestion(trimmed, lastSuggestionsRef.current)) {
      clearInvalidCity()
    }
  }

  const handleSelectSuggestion = (suggestion) => {
    isSelectingRef.current = false
    committedValueRef.current = suggestion.city
    onChange(suggestion.city)
    onSelectSuggestion?.(suggestion)
    lastSuggestionsRef.current = []
    setSuggestions([])
    setIsOpen(false)
    setSearchError('')
  }

  const handleBlur = () => {
    window.setTimeout(() => {
      if (isSelectingRef.current) {
        return
      }

      setIsOpen(false)
      pendingBlurValidationRef.current = true

      if (!isLoading) {
        validateBlurredValue()
      }
    }, 0)
  }

  useEffect(() => {
    if (!pendingBlurValidationRef.current || isLoading) {
      return
    }

    validateBlurredValue()
  }, [isLoading, value])

  return (
    <div className="relative" ref={containerRef}>
      <input
        aria-autocomplete="list"
        aria-controls={isOpen ? listboxId : undefined}
        aria-expanded={isOpen}
        autoComplete="off"
        className={inputClassName}
        id="businessCity"
        placeholder="Search Cebu city"
        role="combobox"
        type="text"
        value={value || ''}
        onBlur={handleBlur}
        onChange={(event) => {
          committedValueRef.current = ''
          onChange(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (committedValueRef.current === String(value || '').trim()) {
            return
          }

          if (suggestions.length > 0) {
            setIsOpen(true)
          }
        }}
      />

      {isLoading && (
        <p className="mt-1 text-xs text-[#6f6559]">Searching cities...</p>
      )}

      {!isLoading && searchError && (
        <p className="mt-1 text-xs text-[#6f6559]">{searchError}</p>
      )}

      {shouldShowError && errorMessage && (
        <p className={errorTextClassName}>{errorMessage}</p>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[#d7d2ca] bg-white py-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} role="presentation">
              <button
                className="w-full px-4 py-2 text-left text-sm text-[#2a2927] transition hover:bg-[#f5f3ef]"
                role="option"
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  isSelectingRef.current = true
                }}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <span className="block font-medium">
                  {suggestion.district || suggestion.city}
                </span>
                <span className="block text-xs text-[#6f6559]">
                  {[suggestion.district ? suggestion.city : null, suggestion.street]
                    .filter(Boolean)
                    .join(' • ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CebuCityAutocomplete
