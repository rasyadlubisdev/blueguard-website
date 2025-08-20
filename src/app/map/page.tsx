// src/app/map/page.tsx - Enhanced dengan Auth dan ML Integration (FIXED)
'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Plus, Filter, Search, RefreshCw, Settings, Wifi, WifiOff, Zap, AlertCircle } from 'lucide-react'
import { MarkerData, SensorFormData, WaterReading, Prediction as PredictionType, ModelInfo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AddSensorModal } from '@/components/map/add-sensor-modal'
import { SensorList } from '@/components/map/sensor-list'
import { useAuth, useNotifications } from '@/components/providers'
import { apiService } from '@/lib/api'

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

export default function MapPage() {
  const { user, loading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()

  // State management
  const [sensors, setSensors] = useState<MarkerData[]>([])
  const [selectedSensorId, setSelectedSensorId] = useState<string>('')
  const [showSensorList, setShowSensorList] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all')
  const [dataMode, setDataMode] = useState<'auto' | 'manual'>('auto')
  const [predictions, setPredictions] = useState<{[key: string]: { nowcast: MLApiResponse, forecast: MLApiResponse }}>({})


  // Mock data with enhanced structure
  const mockSensors: MarkerData[] = [
      {
        id: 'sensor_001',
        name: 'Kali Ciliwung - Manggarai',
        location: { lat: -6.2088, lng: 106.8456 },
        river: 'Kali Ciliwung',
        status: 'active',
        prediction: {
          sensor_id: 'sensor_001',
          timestamp_input: new Date(),
          nowcast: {
            wqi: 45.2,
            quality_class: 'Good',
            model_info: { name: 'ElasticNet', type: 'sklearn' }
          },
          forecast: {
            horizon: 365,
            wqi: 42.8,
            quality_class: 'Poor',
            model_info: { name: 'XGBRegressor', type: 'sklearn' }
          },
          status: 'ok',
          created_at: new Date()
        },
        latestReading: {
          sensor_id: 'sensor_001',
          timestamp: new Date(),
          ph: 7.2,
          tds: 320,
          wqi_raw: 45.2,
          turbidity: 15.2,
          temperature: 26.5,
          dissolved_oxygen: 6.8,
          ec: 450
        },
      },
      {
        id: 'sensor_002',
        name: 'Kali Pesanggrahan - Kebayoran',
        location: { lat: -6.2615, lng: 106.7809 },
        river: 'Kali Pesanggrahan',
        status: 'active',
        prediction: {
          sensor_id: 'sensor_002',
          timestamp_input: new Date(),
          nowcast: {
            wqi: 38.5,
            quality_class: 'Poor',
            model_info: { name: 'ElasticNet', type: 'sklearn' }
          },
          status: 'ok',
          created_at: new Date()
        },
        latestReading: {
          sensor_id: 'sensor_002',
          timestamp: new Date(),
          ph: 6.8,
          tds: 420,
          wqi_raw: 38.5,
          turbidity: 22.1,
          temperature: 27.8,
          dissolved_oxygen: 5.2,
          ec: 580
        },
      },
      {
        id: 'sensor_003',
        name: 'Kali Sunter - Kelapa Gading',
        location: { lat: -6.1570, lng: 106.9101 },
        river: 'Kali Sunter',
        status: 'maintenance',
        latestReading: {
          sensor_id: 'sensor_003',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          ph: 7.5,
          tds: 280,
          wqi_raw: 65.3,
          turbidity: 8.7,
          temperature: 25.9,
          dissolved_oxygen: 7.5,
          ec: 380
        },
      }
    ]


  // Load sensors on component mount
  useEffect(() => {
    if (!authLoading) {
      setSensors(mockSensors)
      if (mockSensors.length > 0) {
        setSelectedSensorId(mockSensors[0].id)
      }
    }
  }, [authLoading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      addNotification({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to access the sensor map.',
      })
      router.push('/auth?mode=signin')
    }
  }, [user, authLoading, router, addNotification])

  // Filter sensors based on search and status
  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sensor.river || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // API Integration Functions
  const callMLAPI = async (endpoint: 'nowcast' | 'forecast', sensorData: SensorReadingForML[]): Promise<MLApiResponse> => {
    setLoading(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'https://rasyadlubis-blueguard-api.hf.space'
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensor_id: sensorData[0]?.sensor_id || 'unknown',
          readings: sensorData.map(sd => ({...sd, timestamp: new Date(sd.timestamp).toISOString()})),
          ...(endpoint === 'forecast' && { horizon: 365 })
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json() as MLApiResponse;
    } catch (error) {
      console.error('ML API call failed:', error)
      addNotification({
          type: 'error',
          title: 'ML API Error',
          message: 'Failed to get prediction from the model.',
      });
      // Return mock data for demo purposes on failure
      return {
        sensor_id: sensorData[0]?.sensor_id || 'unknown',
        task: endpoint,
        prediction: {
          wqi: Math.random() * 100,
          quality_class: ['Excellent', 'Good', 'Poor', 'Very Poor'][Math.floor(Math.random() * 4)],
          confidence: 0.75 + Math.random() * 0.25,
          horizon: endpoint === 'forecast' ? 365 : 0
        },
        model_info: {
          name: endpoint === 'forecast' ? 'XGBRegressor' : 'ElasticNet',
          type: 'sklearn',
          version: '1.0.0'
        },
        status: 'success',
        timestamp: new Date().toISOString(),
        explanations: {}
      }
    } finally {
      setLoading(false)
    }
  }

  const syncWithFirebase = async (sensorId: string) => {
    if (!user) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to sync sensor data.',
      })
      return
    }

    setLoading(true)
    try {
      // Replace with actual Firebase call
      const latestReading = await apiService.getLatestSensorReading(sensorId);
      
      if(latestReading) {
        setSensors(prev => prev.map(sensor =>
          sensor.id === sensorId
            ? {
                ...sensor,
                lastUpdate: new Date(),
                latestReading: latestReading,
              }
            : sensor
        ));
         addNotification({
            type: 'success',
            title: 'Sync Successful',
            message: `Sensor ${sensorId} data updated from Firebase.`,
        });
      } else {
         addNotification({
            type: 'warning',
            title: 'No New Data',
            message: `No new data found for sensor ${sensorId}.`,
        });
      }

    } catch (error) {
      console.error('Firebase sync failed:', error)
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync sensor data. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const runMLPrediction = async (sensorId: string) => {
    if (!user) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to run predictions.',
      })
      return
    }

    setLoading(true)
    try {
      const sensor = sensors.find(s => s.id === sensorId)
      if (!sensor?.latestReading) {
        throw new Error('No sensor data available')
      }

      const { latestReading, location } = sensor;
      const sensorReading: SensorReadingForML = {
        sensor_id: sensorId,
        timestamp: latestReading.timestamp,
        ph: latestReading.ph || 7.0,
        ec: latestReading.ec || 450,
        co3: 12, // Mock or retrieve if available
        hco3: 180,
        cl: 25,
        so4: 18,
        no3: 8,
        th: 220,
        ca: 65,
        mg: 15,
        na: 28,
        k: 5,
        f: 0.8,
        tds: latestReading.tds || 300,
        turbidity: latestReading.turbidity,
        temperature: latestReading.temperature,
        dissolved_oxygen: latestReading.dissolved_oxygen,
        latitude: location.lat,
        longitude: location.lng,
        state: "DKI Jakarta",
        district: "Jakarta"
      }

      const [nowcast, forecast] = await Promise.all([
        callMLAPI('nowcast', [sensorReading]),
        callMLAPI('forecast', [sensorReading])
      ])

      // Update predictions state
      setPredictions(prev => ({ ...prev, [sensorId]: { nowcast, forecast } }))

      // Update sensor with new predictions
      setSensors(prev => prev.map(s =>
        s.id === sensorId
          ? {
              ...s,
              prediction: {
                sensor_id: sensorId,
                timestamp_input: new Date(),
                nowcast: {
                  wqi: nowcast.prediction.wqi,
                  quality_class: nowcast.prediction.quality_class,
                  model_info: nowcast.model_info
                },
                forecast: {
                  horizon: forecast.prediction.horizon,
                  wqi: forecast.prediction.wqi,
                  quality_class: forecast.prediction.quality_class,
                  model_info: forecast.model_info
                },
                status: 'ok',
                created_at: new Date()
              } as PredictionType
            }
          : s
      ))

      addNotification({
        type: 'success',
        title: 'Prediction Complete',
        message: `ML predictions generated for sensor ${sensorId}.`,
      })
    } catch (error) {
      console.error('ML prediction failed:', error)
      addNotification({
        type: 'error',
        title: 'Prediction Failed',
        message: 'Failed to generate ML predictions. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSensor = async (formData: SensorFormData) => {
    if (!user) {
      addNotification({ type: 'error', title: 'Authentication Required', message: 'Please sign in to add sensors.' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'operator') {
      addNotification({ type: 'error', title: 'Permission Denied', message: 'Only admins and operators can add sensors.' });
      return;
    }

    setLoading(true);
    try {
      const newSensorData = {
        name: formData.name,
        location: { lat: formData.lat, lng: formData.lng },
        river: formData.river,
        status: 'active' as 'active',
        meta: { type: formData.type }
      };
      
      await apiService.addSensor(newSensorData);
      
      // Reload sensors from the source of truth
      const updatedSensors = await apiService.getSensors();
      setSensors(updatedSensors.map(s => ({...s, latestReading: undefined, prediction: undefined})));

      setShowAddModal(false);
      addNotification({ type: 'success', title: 'Sensor Added', message: `${formData.name} has been successfully added.` });
    } catch (error) {
      console.error('Failed to add sensor:', error);
      addNotification({ type: 'error', title: 'Failed to Add Sensor', message: 'An error occurred while adding the sensor.' });
    } finally {
      setLoading(false);
    }
  }

  const handleSensorClick = (sensor: MarkerData) => {
    setSelectedSensorId(sensor.id)
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (user && (user.role === 'admin' || user.role === 'operator')) {
      // This logic should be passed to the modal to pre-fill coordinates
      console.log('Map clicked at:', lat, lng)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    // The redirect logic in useEffect will handle this, but this is a fallback.
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Redirecting to sign-in page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Water Quality Sensor Map</h1>
              <p className="text-gray-600">Real-time monitoring dengan ML predictions</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDataMode(dataMode === 'auto' ? 'manual' : 'auto')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dataMode === 'auto'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dataMode === 'auto' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  <span>{dataMode === 'auto' ? 'Auto Sync' : 'Manual'}</span>
                </button>
              </div>

              {(user.role === 'admin' || user.role === 'operator') && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sensor
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search sensors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {(['all', 'active', 'maintenance', 'inactive'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className="text-xs"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowSensorList(!showSensorList)}
              className="lg:hidden"
            >
              {showSensorList ? 'Hide' : 'Show'} Sensors
            </Button>
            <Badge variant="outline">
              {filteredSensors.length} sensor{filteredSensors.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sensor List */}
          {showSensorList && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Sensor Network</CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  <SensorList
                    sensors={filteredSensors}
                    selectedSensorId={selectedSensorId}
                    onSensorSelect={setSelectedSensorId}
                  />
                  
                  {/* Action buttons for selected sensor */}
                  {selectedSensorId && (
                    <div className="p-4 border-t border-gray-200 space-y-2">
                      {sensors.find(s => s.id === selectedSensorId)?.autoSync && (
                        <Button
                          onClick={() => syncWithFirebase(selectedSensorId)}
                          disabled={loading}
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          size="sm"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                          {loading ? 'Syncing...' : 'Sync Firebase'}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => runMLPrediction(selectedSensorId)}
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-600"
                        size="sm"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Run ML Prediction
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Map */}
          <div className={showSensorList ? "lg:col-span-3" : "lg:col-span-4"}>
            <Card>
              <CardContent className="p-0">
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <MapView
                    sensors={filteredSensors}
                    onSensorClick={handleSensorClick}
                    onMapClick={handleMapClick}
                    selectedSensorId={selectedSensorId}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
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