import { MarkerData } from '@/types'
import { Badge } from '@/components/ui/badge'
import { MapPin, Activity, Clock } from 'lucide-react'
import { formatDate, getWaterQualityText } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SensorListProps {
  sensors: MarkerData[]
  selectedSensorId?: string
  onSensorSelect: (sensorId: string) => void
}

export function SensorList({ sensors, selectedSensorId, onSensorSelect }: SensorListProps) {
  if (sensors.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>Tidak ada sensor yang ditemukan</p>
      </div>
    )
  }

  return (
    <div className="max-h-[500px] overflow-y-auto">
      {sensors.map((sensor) => {
        const wqi = sensor.prediction?.nowcast?.wqi || sensor.latestReading?.wqi_raw
        const qualityClass = sensor.prediction?.nowcast?.quality_class || 
          (wqi ? getWaterQualityText(wqi) : 'Unknown')
        const lastUpdate = sensor.prediction?.created_at || 
          sensor.latestReading?.timestamp || 
          new Date()

        return (
          <div
            key={sensor.id}
            className={cn(
              "p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
              selectedSensorId === sensor.id && "bg-blue-50 border-l-4 border-l-blue-500"
            )}
            onClick={() => onSensorSelect(sensor.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{sensor.name}</h4>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="truncate">{sensor.river || 'Jakarta'}</span>
                </div>
              </div>
              
              <Badge 
                variant={sensor.status === 'active' ? 'default' : 'secondary'}
                className={cn(
                  "text-xs",
                  sensor.status === 'active' && "bg-green-500",
                  sensor.status === 'maintenance' && "bg-yellow-500",
                  sensor.status === 'inactive' && "bg-gray-500"
                )}
              >
                {sensor.status === 'active' ? 'Aktif' : 
                 sensor.status === 'maintenance' ? 'Maintenance' : 'Tidak Aktif'}
              </Badge>
            </div>

            {wqi && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">WQI:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">{wqi.toFixed(1)}</span>
                  <Badge variant="water-quality" waterQuality={qualityClass} className="text-xs">
                    {qualityClass}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatDate(lastUpdate)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}