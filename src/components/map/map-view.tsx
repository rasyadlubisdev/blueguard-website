// src/components/map/map-view.tsx - Fixed with proper props and interface
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MarkerData } from '@/types'
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
const createSensorIcon = (status: 'active' | 'inactive' | 'maintenance', wqi?: number, isSelected = false) => {
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

  const size = isSelected ? 28 : 20
  const borderWidth = isSelected ? 4 : 3

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${isSelected ? '#1d4ed8' : 'white'};
        box-shadow: 0 ${isSelected ? 4 : 2}px ${isSelected ? 8 : 4}px rgba(0,0,0,${isSelected ? 0.4 : 0.3});
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: ${Math.floor(size * 0.4)}px;
          height: ${Math.floor(size * 0.4)}px;
          background-color: white;
          border-radius: 50%;
          ${status === 'active' ? 'animation: pulse 2s infinite;' : ''}
        "></div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background-color: #1d4ed8;
            border: 2px solid white;
            border-radius: 50%;
          "></div>
        ` : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface MapViewProps {
  sensors: MarkerData[]
  selectedSensor?: MarkerData | null
  onSensorSelect: (sensorId: string) => void
  onMapClick?: (lat: number, lng: number) => void
  className?: string
}

// Jakarta bounds
const JAKARTA_BOUNDS: [[number, number], [number, number]] = [
  [-6.4, 106.6], // Southwest
  [-5.8, 107.1]  // Northeast
]

function MapView({ 
  sensors, 
  selectedSensor, 
  onSensorSelect, 
  onMapClick, 
  className = "w-full h-full" 
}: MapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null)

  const defaultCenter: [number, number] = [-6.2088, 106.8456] // Jakarta center

  useEffect(() => {
    if (map && selectedSensor) {
      map.setView([selectedSensor.location.lat, selectedSensor.location.lng], 15, {
        animate: true,
        duration: 1
      })
    }
  }, [map, selectedSensor])

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
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
          minZoom={10}
        />
        
        <MapEvents />
        
        {sensors.map((sensor) => {
          const wqi = sensor.prediction?.nowcast?.wqi || sensor.latestReading?.wqi_raw
          const isSelected = selectedSensor?.id === sensor.id

          return (
            <Marker
              key={sensor.id}
              position={[sensor.location.lat, sensor.location.lng]}
              icon={createSensorIcon(sensor.status, wqi, isSelected)}
              eventHandlers={{
                click: () => onSensorSelect(sensor.id!)
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Popup 
                className="sensor-popup"
                closeButton={true}
                autoClose={false}
                closeOnClick={false}
              >
                <SensorPopup sensor={sensor} />
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      <style jsx global>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.7; 
            transform: scale(0.9);
          }
        }
        
        .sensor-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
          min-width: 200px;
        }
        
        .sensor-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }
        
        .sensor-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        .leaflet-control-zoom a {
          background-color: white !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
        }
        
        .leaflet-control-zoom a:hover {
          background-color: #f9fafb !important;
          border-color: #d1d5db !important;
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