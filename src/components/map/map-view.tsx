'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Sensor, MarkerData } from '@/types'
import { SensorPopup } from './sensor-popup'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Create custom icons for different sensor statuses
const createSensorIcon = (status: 'active' | 'inactive' | 'maintenance', wqi?: number) => {
  let color = '#6b7280' // gray for inactive
  
  if (status === 'active') {
    if (wqi !== undefined) {
      if (wqi <= 25) color = '#10b981' // excellent - green
      else if (wqi <= 50) color = '#3b82f6' // good - blue  
      else if (wqi <= 75) color = '#f59e0b' // poor - yellow
      else if (wqi <= 100) color = '#ef4444' // very poor - red
      else color = '#7c2d12' // unsuitable - dark red
    } else {
      color = '#3b82f6' // default blue for active
    }
  } else if (status === 'maintenance') {
    color = '#f59e0b' // yellow for maintenance
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          ${status === 'active' ? 'animation: pulse 2s infinite;' : ''}
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

interface MapViewProps {
  sensors: MarkerData[]
  onSensorClick?: (sensor: MarkerData) => void
  onMapClick?: (lat: number, lng: number) => void
  selectedSensorId?: string
  className?: string
}

// Jakarta bounds
const JAKARTA_BOUNDS: [[number, number], [number, number]] = [
  [-6.4, 106.6], // Southwest
  [-5.8, 107.1]  // Northeast
]

function MapView({ sensors, onSensorClick, onMapClick, selectedSensorId, className }: MapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null)

  const defaultCenter: [number, number] = [-6.2088, 106.8456] // Jakarta center

  useEffect(() => {
    if (map && selectedSensorId) {
      const selectedSensor = sensors.find(s => s.id === selectedSensorId)
      if (selectedSensor) {
        map.setView([selectedSensor.location.lat, selectedSensor.location.lng], 15, {
          animate: true
        })
      }
    }
  }, [map, selectedSensorId, sensors])

  function MapEvents() {
    const map = useMap()
    
    useEffect(() => {
      setMap(map)
      
      if (onMapClick) {
        const handleClick = (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng)
        }
        
        map.on('click', handleClick)
        return () => {
          map.off('click', handleClick)
        }
      }
    }, [map])

    return null
  }

  return (
    <div className={className}>
      <MapContainer
        center={defaultCenter}
        zoom={11}
        className="w-full h-full rounded-lg"
        maxBounds={JAKARTA_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
          minZoom={10}
        />
        
        <MapEvents />
        
        {sensors.map((sensor) => (
          <Marker
            key={sensor.id}
            position={[sensor.location.lat, sensor.location.lng]}
            icon={createSensorIcon(
              sensor.status, 
              sensor.prediction?.nowcast?.wqi || sensor.latestReading?.wqi_raw
            )}
            eventHandlers={{
              click: () => onSensorClick?.(sensor)
            }}
          >
            <Popup className="sensor-popup">
              <SensorPopup sensor={sensor} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style jsx global>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .sensor-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        
        .sensor-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}

// Export as dynamic component to avoid SSR issues
export default dynamic(() => Promise.resolve(MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <LoadingSpinner size="lg" />
    </div>
  )
})