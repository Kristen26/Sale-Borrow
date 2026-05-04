
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
});

interface LeafletMapProps {
  onLocationSelect: (address: string, lat: number, lon: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

interface SearchResult {
  x: number;
  y: number;
  label: string;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: LeafletMapProps['onLocationSelect'] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(address, lat, lng);
      } catch (error) {
        console.error('Ошибка получения адреса:', error);
        onLocationSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);

  return null;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);

  return null;
}

export default function LeafletMap({ 
  onLocationSelect, 
  initialCenter = [58.5214, 31.2761], 
  initialZoom = 12 
}: LeafletMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);
  const searchTimeoutRef = useRef<any>(null);
  const provider = new OpenStreetMapProvider();

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await provider.search({ query: value });
        const suggestionsList = results.map((result: SearchResult) => result.label);
        setSuggestions(suggestionsList);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setSuggestions([]);
      }
    }, 500);
  };

  const handleSelectSuggestion = async (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    
    try {
      const results = await provider.search({ query: suggestion });
      if (results.length > 0) {
        const result = results[0] as SearchResult;
        const lat = result.y;
        const lon = result.x;
        
        setMarkerPosition([lat, lon]);
        setMapCenter([lat, lon]);
        setMapZoom(15);
        setSelectedAddress(result.label);
        onLocationSelect(result.label, lat, lon);
      }
    } catch (error) {
      console.error('Ошибка геокодирования:', error);
    }
  };

  const handleMapClick = (address: string, lat: number, lon: number) => {
    setMarkerPosition([lat, lon]);
    setSelectedAddress(address);
    setSearchQuery(address);
    onLocationSelect(address, lat, lon);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Поисковая строка */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Введите адрес (город, улица, дом)..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#666')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#ccc')}
        />
        
        {/* Выпадающий список подсказок */}
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Карта */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler onLocationSelect={handleMapClick} />
        <MapController center={mapCenter} zoom={mapZoom} />
        {markerPosition && <Marker position={markerPosition} />}
      </MapContainer>

      {/* Отображение выбранного адреса */}
      {selectedAddress && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            fontSize: '14px',
            border: '1px solid #4caf50',
          }}
        >
          <strong>📍 Выбранный адрес:</strong> {selectedAddress}
        </div>
      )}
    </div>
  );
}