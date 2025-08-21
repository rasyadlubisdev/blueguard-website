// src/components/map/sensor-list.tsx - Fixed with proper props
import { MarkerData } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, Activity, Clock, Play, TrendingUp, Edit, Trash2, 
  AlertCircle, Wifi, WifiOff 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface SensorListProps {
  sensors: MarkerData[]
  selectedSensor?: MarkerData | null
  onSensorSelect: (sensorId: string) => void
  onSensorUpdate?: (sensorId: string, updates: Partial<MarkerData>) => void
  onSensorDelete?: (sensorId: string) => void
  onRunPrediction?: (sensorId: string, type: 'nowcast' | 'forecast') => void
  mlApiOnline?: boolean
}

const getWaterQualityColor = (wqi: number) => {
  if (wqi <= 25) return 'bg-green-500 text-white'
  if (wqi <= 50) return 'bg-blue-500 text-white'
  if (wqi <= 75) return 'bg-yellow-500 text-black'
  if (wqi <= 100) return 'bg-orange-500 text-white'
  return 'bg-red-500 text-white'
}

const getWaterQualityText = (wqi: number) => {
  if (wqi <= 25) return 'Excellent'
  if (wqi <= 50) return 'Good'
  if (wqi <= 75) return 'Poor'
  if (wqi <= 100) return 'Very Poor'
  return 'Unsuitable'
}

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: id })
}

export function SensorList({ 
  sensors, 
  selectedSensor, 
  onSensorSelect, 
  onSensorUpdate,
  onSensorDelete,
  onRunPrediction,
  mlApiOnline = false
}: SensorListProps) {
  if (sensors.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>Tidak ada sensor yang ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-2">
      {sensors.map((sensor) => {
        const wqi = sensor.prediction?.nowcast?.wqi || sensor.latestReading?.wqi_raw
        const qualityClass = sensor.prediction?.nowcast?.quality_class || 
          (wqi ? getWaterQualityText(wqi) : 'Unknown')
        
        const lastUpdate = sensor.lastUpdate || 
          (sensor.latestReading?.timestamp ? new Date(sensor.latestReading.timestamp) : sensor.updated_at)

        const isSelected = selectedSensor?.id === sensor.id
        const hasAlerts = sensor.alerts && sensor.alerts.length > 0

        return (
          <div
            key={sensor.id}
            className={cn(
              "border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
              isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onSensorSelect(sensor.id!)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{sensor.name}</h4>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{sensor.river || 'Jakarta'}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {hasAlerts && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <Badge 
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    sensor.status === 'active' && "bg-green-100 text-green-800",
                    sensor.status === 'maintenance' && "bg-yellow-100 text-yellow-800",
                    sensor.status === 'inactive' && "bg-gray-100 text-gray-800"
                  )}
                >
                  {sensor.status === 'active' ? 'Aktif' : 
                   sensor.status === 'maintenance' ? 'Maintenance' : 'Tidak Aktif'}
                </Badge>
              </div>
            </div>

            {/* WQI Display */}
            {wqi && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">WQI:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">{wqi.toFixed(1)}</span>
                  <Badge 
                    className={cn("text-xs", getWaterQualityColor(wqi))}
                  >
                    {qualityClass}
                  </Badge>
                </div>
              </div>
            )}

            {/* Alerts */}
            {hasAlerts && (
              <div className="mb-2">
                <div className="text-xs text-red-600 space-y-1">
                  {sensor.alerts?.slice(0, 2).map((alert, index) => (
                    <div key={index} className="flex items-start space-x-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{alert}</span>
                    </div>
                  ))}
                  {sensor.alerts && sensor.alerts.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{sensor.alerts.length - 2} alert lainnya
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auto Sync Status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-xs text-gray-500">
                {sensor.autoSync ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    <span>Auto Sync</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    <span>Manual</span>
                  </>
                )}
              </div>
              
              {lastUpdate && (
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatDate(lastUpdate)}</span>
                </div>
              )}
            </div>

            {/* Actions - Only show when selected */}
            {isSelected && (
              <div className="border-t pt-2 mt-2 space-y-2">
                {/* ML Actions */}
                {sensor.status === 'active' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={!mlApiOnline}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRunPrediction?.(sensor.id!, 'nowcast')
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Nowcast
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={!mlApiOnline}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRunPrediction?.(sensor.id!, 'forecast')
                      }}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Forecast
                    </Button>
                  </div>
                )}

                {/* Management Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      // You can implement edit modal here
                      onSensorUpdate?.(sensor.id!, {})
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Hapus sensor "${sensor.name}"?`)) {
                        onSensorDelete?.(sensor.id!)
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Hapus
                  </Button>
                </div>

                {/* ML Status */}
                <div className="text-xs text-center text-gray-500">
                  ML API: {mlApiOnline ? (
                    <span className="text-green-600">Online</span>
                  ) : (
                    <span className="text-red-600">Offline</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}