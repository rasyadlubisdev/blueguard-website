// src/app/map/page.tsx - Enhanced dengan Auth dan ML Integration (FIXED - All TypeScript Errors Resolved)
'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Plus, Filter, Search, RefreshCw, Settings, Wifi, WifiOff, Zap, AlertCircle } from 'lucide-react'
import { MarkerData, SensorFormData, WaterReading, Prediction as PredictionType, ModelInfo, SensorReading } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AddSensorModal } from '@/components/map/add-sensor-modal'
import { SensorList } from '@/components/map/sensor-list'
import { useAuth, useNotifications } from '@/components/providers'
import ApiService, { MLPredictionResponse, SensorReading as ApiSensorReading } from '@/lib/api'

// Dynamic import to avoid SSR issues
const MapView = dynamic(() => import('@/components/map/map-view'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
})

// Tipe spesifik untuk respons dari API Machine Learning
interface MLApiResponse {
  sensor_id: string;
  task: 'nowcast' | 'forecast';
  prediction: {
    wqi: number;
    quality_class: string;
    confidence: number;
    horizon: number;
  };
  model_info: ModelInfo;
  status: string;
  timestamp: string;
  explanations: Record<string, unknown>;
}

// Tipe untuk data yang dikirim ke API Machine Learning
interface SensorReadingForML extends WaterReading {
  latitude: number;
  longitude: number;
  state: string;
  district: string;
}

// Helper function to convert MLPredictionResponse to Prediction
const convertMLResponseToPrediction = (mlResponse: MLPredictionResponse, sensorId: string): PredictionType => {
  return {
    id: `${sensorId}-${Date.now()}`,
    sensor_id: sensorId,
    timestamp_input: new Date(),
    created_at: new Date(),
    status: mlResponse.status as 'ok' | 'insufficient_history' | 'error',
    nowcast: mlResponse.task === 'nowcast' ? {
      wqi: mlResponse.prediction.wqi,
      quality_class: mlResponse.prediction.quality_class,
      confidence: mlResponse.prediction.confidence,
      model_info: {
        name: mlResponse.model_info.name,
        type: mlResponse.model_info.type as ModelInfo['type'],
        version: mlResponse.model_info.version
      }
    } : undefined,
    forecast: mlResponse.task === 'forecast' ? {
      wqi: mlResponse.prediction.wqi,
      quality_class: mlResponse.prediction.quality_class,
      confidence: mlResponse.prediction.confidence,
      horizon: mlResponse.prediction.horizon,
      model_info: {
        name: mlResponse.model_info.name,
        type: mlResponse.model_info.type as ModelInfo['type'],
        version: mlResponse.model_info.version
      }
    } : undefined,
    explanations: mlResponse.explanations
  }
}

export default function MapPage() {
  const { user, loading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()

  // State management
  const [sensors, setSensors] = useState<MarkerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState<MarkerData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mlApiStatus, setMlApiStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Load sensors when user is available
  useEffect(() => {
    if (user?.uid) {
      loadSensors()
      checkMLApiStatus()
    }
  }, [user?.uid])

  const loadSensors = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      setError(null)
      
      const sensorsData = await ApiService.getSensors(user.uid)
      
      // Transform sensors to MarkerData with additional info
      const markersData: MarkerData[] = await Promise.all(
        sensorsData.map(async (sensor) => {
          try {
            // Get latest reading for each sensor
            const readings = await ApiService.getSensorReadings(sensor.id!, 1)
            const latestReading: SensorReading | undefined = readings[0] || undefined

            // Get predictions if available
            let prediction: PredictionType | undefined
            try {
              const predictions = await ApiService.getPredictions(sensor.id!)
              if (predictions[0]) {
                prediction = convertMLResponseToPrediction(predictions[0], sensor.id!)
              }
            } catch (predError) {
              console.warn(`Failed to get prediction for sensor ${sensor.id}:`, predError)
            }

            // Generate alerts based on latest reading
            let alerts: string[] = []
            if (latestReading) {
              const readingForAPI = {
                ...latestReading,
                timestamp: latestReading.timestamp instanceof Date 
                  ? latestReading.timestamp.toISOString() 
                  : latestReading.timestamp,
                well_id: latestReading.well_id || latestReading.sensor_id
              } as typeof latestReading & { timestamp: string; well_id: string }
              
              const generatedAlerts = ApiService.generateAlerts(readingForAPI, sensor.name)
              alerts = generatedAlerts.map(alert => alert.message)
            }

            return {
              ...sensor,
              latestReading,
              prediction,
              alerts,
              autoSync: sensor.auto_sync,
              lastUpdate: latestReading ? new Date(latestReading.timestamp) : sensor.updated_at
            } as MarkerData
          } catch (sensorError) {
            console.error(`Error processing sensor ${sensor.id}:`, sensorError)
            return {
              ...sensor,
              latestReading: undefined, // Changed from null to undefined
              alerts: [],
              autoSync: sensor.auto_sync,
              lastUpdate: sensor.updated_at
            } as MarkerData
          }
        })
      )

      setSensors(markersData)
    } catch (err) {
      console.error('Error loading sensors:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sensors')
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat data sensor'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkMLApiStatus = async () => {
    try {
      setMlApiStatus('checking')
      await ApiService.healthCheck()
      setMlApiStatus('online')
    } catch (error) {
      console.warn('ML API health check failed:', error)
      setMlApiStatus('offline')
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadSensors()
    await checkMLApiStatus()
    setIsRefreshing(false)
    
    addNotification({
      type: 'success',
      title: 'Refresh Berhasil',
      message: 'Data sensor telah diperbarui'
    })
  }

  const handleAddSensor = async (sensorData: SensorFormData) => {
    if (!user?.uid) return

    try {
      const newSensor = {
        name: sensorData.name,
        location: {
          lat: sensorData.lat,
          lng: sensorData.lng
        },
        river: sensorData.river,
        status: 'active' as const,
        auto_sync: true,
        user_id: user.uid
      }

      const sensorId = await ApiService.addSensor(newSensor)
      
      addNotification({
        type: 'success',
        title: 'Sensor Ditambahkan',
        message: `Sensor "${sensorData.name}" berhasil ditambahkan`
      })

      // Refresh sensors list
      await loadSensors()
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding sensor:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal menambahkan sensor'
      })
    }
  }

  const handleSensorUpdate = async (sensorId: string, updates: Partial<MarkerData>) => {
    try {
      await ApiService.updateSensor(sensorId, {
        name: updates.name,
        location: updates.location,
        river: updates.river,
        status: updates.status,
        auto_sync: updates.autoSync
      })

      addNotification({
        type: 'success',
        title: 'Sensor Diperbarui',
        message: 'Data sensor berhasil diperbarui'
      })

      // Refresh sensors list
      await loadSensors()
    } catch (error) {
      console.error('Error updating sensor:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memperbarui sensor'
      })
    }
  }

  const handleSensorDelete = async (sensorId: string) => {
    try {
      await ApiService.deleteSensor(sensorId)
      
      addNotification({
        type: 'success',
        title: 'Sensor Dihapus',
        message: 'Sensor berhasil dihapus'
      })

      // Refresh sensors list
      await loadSensors()
    } catch (error) {
      console.error('Error deleting sensor:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal menghapus sensor'
      })
    }
  }

  const runPrediction = async (sensorId: string, type: 'nowcast' | 'forecast') => {
    try {
      const readings = await ApiService.getSensorReadings(sensorId, 100) // Get more readings for ML
      
      if (readings.length === 0) {
        throw new Error('Tidak ada data sensor untuk prediksi')
      }

      let result: MLApiResponse | null = null

      if (type === 'nowcast') {
        const apiRequest = ApiService.formatForMLAPI(readings)
        result = await ApiService.getNowcast(apiRequest) as MLApiResponse
      } else {
        const apiRequest = { ...ApiService.formatForMLAPI(readings), horizon: 365 }
        result = await ApiService.getForecast(apiRequest) as MLApiResponse
      }

      if (result) {
        addNotification({
          type: 'success',
          title: `${type === 'nowcast' ? 'Nowcast' : 'Forecast'} Berhasil`,
          message: `WQI: ${result.prediction.wqi.toFixed(1)} - ${result.prediction.quality_class}`
        })

        // Refresh sensors to show updated predictions
        await loadSensors()
      }
    } catch (error) {
      console.error(`Error running ${type}:`, error)
      addNotification({
        type: 'error',
        title: 'Prediksi Gagal',
        message: error instanceof Error ? error.message : `Gagal menjalankan ${type}`
      })
    }
  }

  // Handler for sensor selection - fixed to match expected signature
  const handleSensorSelect = (sensorId: string) => {
    const sensor = sensors.find(s => s.id === sensorId)
    setSelectedSensor(sensor || null)
  }

  // Handler for map sensor add - fixed parameter types
  const handleMapSensorAdd = (lat: number, lng: number) => {
    setShowAddModal(true)
    // You might want to pass lat/lng to the modal
    console.log('Add sensor at:', lat, lng)
  }

  // Filter sensors based on search and status
  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.river?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || sensor.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Peta Sensor</h1>
            <p className="text-sm text-gray-600">
              Kelola dan pantau sensor kualitas air secara real-time
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* ML API Status */}
            <div className="flex items-center space-x-2">
              {mlApiStatus === 'online' ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : mlApiStatus === 'offline' ? (
                <WifiOff className="w-5 h-5 text-red-600" />
              ) : (
                <div className="w-5 h-5 animate-spin">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              <span className={`text-sm font-medium ${
                mlApiStatus === 'online' ? 'text-green-600' : 
                mlApiStatus === 'offline' ? 'text-red-600' : 'text-gray-600'
              }`}>
                ML API {mlApiStatus === 'checking' ? 'Checking...' : 
                       mlApiStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Sensor
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari sensor atau sungai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sensor List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Sensor ({filteredSensors.length})
              </h2>
              {sensors.some(s => s.alerts && s.alerts.length > 0) && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Alert
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <SensorList
                sensors={filteredSensors}
                selectedSensor={selectedSensor}
                onSensorSelect={handleSensorSelect}
                onSensorUpdate={handleSensorUpdate}
                onSensorDelete={handleSensorDelete}
                onRunPrediction={runPrediction}
                mlApiOnline={mlApiStatus === 'online'}
              />
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            sensors={filteredSensors}
            selectedSensor={selectedSensor}
            onSensorSelect={handleSensorSelect}
            onMapClick={handleMapSensorAdd}
            // loading={loading}
          />
        </div>
      </div>

      {/* Add Sensor Modal */}
      <AddSensorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSensor}
      />
    </div>
  )
}