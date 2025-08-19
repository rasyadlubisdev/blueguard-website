import { MapPin, Droplets, Calendar, Activity } from 'lucide-react'
import { MarkerData } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, getWaterQualityText } from '@/lib/utils'

interface SensorPopupProps {
  sensor: MarkerData
}

export function SensorPopup({ sensor }: SensorPopupProps) {
  const wqi = sensor.prediction?.nowcast?.wqi || sensor.latestReading?.wqi_raw
  const qualityClass = sensor.prediction?.nowcast?.quality_class || 
    (wqi ? getWaterQualityText(wqi) : 'Unknown')
  
  const lastUpdate = sensor.prediction?.created_at || 
    sensor.latestReading?.timestamp || 
    new Date()

  return (
    <div className="p-4 min-w-[280px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{sensor.name}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{sensor.river || 'Jakarta'}</span>
          </div>
        </div>
        <Badge 
          variant={sensor.status === 'active' ? 'default' : 'secondary'}
          className={sensor.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
        >
          {sensor.status === 'active' ? 'Aktif' : 
           sensor.status === 'maintenance' ? 'Maintenance' : 'Tidak Aktif'}
        </Badge>
      </div>

      {/* Water Quality Info */}
      {wqi && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Kualitas Air</span>
            <Badge variant="water-quality" waterQuality={qualityClass}>
              {qualityClass}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold text-gray-900">WQI: {wqi.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="space-y-2 mb-4">
        {sensor.latestReading?.tds && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">TDS:</span>
            <span className="font-medium">{sensor.latestReading.tds} ppm</span>
          </div>
        )}
        
        {sensor.latestReading?.ph && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">pH:</span>
            <span className="font-medium">{sensor.latestReading.ph}</span>
          </div>
        )}

        <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
          <Calendar className="w-3 h-3 mr-1" />
          <span>Update: {formatDate(lastUpdate)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          className="flex-1"
          onClick={() => window.open(`/sensors/${sensor.id}`, '_blank')}
        >
          <Activity className="w-4 h-4 mr-1" />
          Detail
        </Button>
        
        {sensor.status === 'active' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              // Trigger prediction
              console.log('Predicting for sensor:', sensor.id)
            }}
          >
            Prediksi
          </Button>
        )}
      </div>
    </div>
  )
}