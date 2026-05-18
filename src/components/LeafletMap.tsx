import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { OpenStreetMapProvider } from 'leaflet-geosearch'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'

delete (
  L.Icon.Default.prototype as L.Icon.Default & {
    _getIconUrl?: string
  })._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
})

interface LeafletMapProps {
  onLocationSelect: (
    address: string,
    lat: number,
    lon: number
  ) => void

  initialCenter?: [number, number]
  initialZoom?: number
}

interface SearchResult {
  x: number
  y: number
  label: string
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: LeafletMapProps['onLocationSelect']
}) {
  const map = useMap()

  useEffect(() => {
    const handleClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        )

        const data = await response.json()

        const address =
          data.display_name ||
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`

        onLocationSelect(address, lat, lng)
      } catch (error) {
        console.error('Ошибка получения адреса:', error)
        onLocationSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng)
      }
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [map, onLocationSelect])

  return null
}

function MapController({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.2,
    })
  }, [map, center, zoom])

  return null
}

export default function LeafletMap({
  onLocationSelect,
  initialCenter = [58.5214, 31.2761],
  initialZoom = 12,
}: LeafletMapProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter)
  const [mapZoom, setMapZoom] = useState(initialZoom)

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const provider = new OpenStreetMapProvider()

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (value.length < 3) {
      setSuggestions([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await provider.search({
          query: value,
        })

        const suggestionsList = results.map(
          (result: SearchResult) => result.label
        )

        setSuggestions(suggestionsList)
      } catch (error) {
        console.error('Ошибка поиска:', error)
        setSuggestions([])
      }
    }, 400)
  }

  const handleSelectSuggestion = async (suggestion: string) => {
    setSearchQuery(suggestion)
    setSuggestions([])

    try {
      const results = await provider.search({
        query: suggestion,
      })

      if (results.length > 0) {
        const result = results[0] as SearchResult
        const lat = result.y
        const lon = result.x

        setMarkerPosition([lat, lon])
        setMapCenter([lat, lon])
        setMapZoom(15)

        onLocationSelect(result.label, lat, lon)
      }
    } catch (error) {
      console.error('Ошибка геокодирования:', error)
    }
  }

  const handleMapClick = (address: string, lat: number, lon: number) => {
    setMarkerPosition([lat, lon])
    setSearchQuery(address)
    onLocationSelect(address, lat, lon)
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.searchWrap}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Поиск адреса на карте..."
          style={styles.input}
        />

        {suggestions.length > 0 && (
          <div style={styles.dropdown}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                style={styles.suggestion}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={styles.map}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <MapClickHandler onLocationSelect={handleMapClick} />
        <MapController center={mapCenter} zoom={mapZoom} />

        {markerPosition && <Marker position={markerPosition} />}
      </MapContainer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
  },

  searchWrap: {
    position: 'relative',
    marginBottom: '14px',
  },

  input: {
    width: '100%',
    height: '52px',
    padding: '0 18px',
    borderRadius: '16px',
    border: '1px solid #e5e5e5',
    background: '#fafafa',
    fontSize: '15px',
    outline: 'none',
    transition: '0.2s',
  },

  dropdown: {
    position: 'absolute',
    top: '58px',
    left: 0,
    right: 0,
    background: '#fff',
    borderRadius: '18px',
    overflow: 'hidden',
    border: '1px solid #f0f0f0',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    zIndex: 1000,
  },

  suggestion: {
    padding: '14px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '1px solid #f5f5f5',
  },

  map: {
    width: '100%',
    height: '320px',
    borderRadius: '24px',
    overflow: 'hidden',
  },
}
