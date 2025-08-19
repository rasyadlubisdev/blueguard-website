'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Filter, Search, RefreshCw, Settings } from 'lucide-react'
import { MarkerData, SensorFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AddSensorModal } from '@/components/map/add-sensor-modal'
import { SensorList } from '@/components/map/sensor-list'
import { useAuth } from '@/components/providers'

// Dynamic import to avoid SSR issues
const MapView = dynamic(() => import('@/components/map/map-view'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
})

// Mock data - replace with actual API calls
const mockSensors: MarkerData[] = [
  {
    id: 'sensor_001',
    name: 'Sensor Kali Ciliwung 1',
    location: { lat: -6.2088, lng: 106.8456 },
    river: 'Kali Ciliwung',
    status: 'active',
    prediction: {
      sensor_id: 'sensor_001',
      timestamp_input: new Date(),
      nowcast: {
        wqi: 45.2,
        quality_class: 'Good',
        model_info: { name: 'XGBoost', type: 'sklearn' }
      },
      status: 'ok',
      created_at: new Date()
    },
    latestReading: {
      sensor_id: 'sensor_001',
      timestamp: new Date(),
      tds: 320,
      ph: 7.2,
      wqi_raw: 45.2
    }
  },
  {
    id: 'sensor_002', 
    name: 'Sensor Kali Pesanggrahan',
    location: { lat: -6.2615, lng: 106.7809 },
    river: 'Kali Pesanggrahan',
    status: 'active',
    prediction: {
      sensor_id: 'sensor_002',
      timestamp_input: new Date(),
      nowcast: {
        wqi: 78.5,
        quality_class: 'Poor',
        model_info: { name: 'XGBoost', type: 'sklearn' }
      },
      status: 'ok',
      created_at: new Date()
    },
    latestReading: {
      sensor_id: 'sensor_002',
      timestamp: new Date(),
      tds: 450,
      ph: 6.8,
      wqi_raw: 78.5
    }
  },
  {
    id: 'sensor_003',
    name: 'Sensor Kali Sunter',
    location: { lat: -6.1502, lng: 106.8650 },
    river: 'Kali Sunter',
    status: 'maintenance',
    latestReading: {
      sensor_id: 'sensor_003',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      tds: 380,
      ph: 7.0,
      wqi_raw: 62.1
    }
  }
]

export default function MapPage() {
  const { user } = useAuth()
  const [sensors, setSensors] = useState<MarkerData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSensorId, setSelectedSensorId] = useState<string>()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSensorList, setShowSensorList] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Load sensors on mount
  useEffect(() => {
    loadSensors()
  }, [])

  const loadSensors = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSensors(mockSensors)
    } catch (error) {
      console.error('Failed to load sensors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSensors()
    setRefreshing(false)
  }

  const handleSensorClick = (sensor: MarkerData) => {
    setSelectedSensorId(sensor.id)
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (user?.role === 'admin') {
      console.log('Map clicked at:', lat, lng)
      // Could open add sensor modal with coordinates
    }
  }

  const handleAddSensor = (sensorData: SensorFormData) => {
    console.log('Adding sensor:', sensorData)
    // Add sensor logic here
    // TODO: Implement API call to add sensor
    const newSensor: MarkerData = {
      id: `sensor_${Date.now()}`, // Generate unique ID
      name: sensorData.name,
      location: { lat: sensorData.lat, lng: sensorData.lng },
      river: sensorData.river,
      status: 'active',
      meta: {
        type: sensorData.type
      }
    }
    
    // Add to local state (replace with API call)
    setSensors(prev => [...prev, newSensor])
    setShowAddModal(false)
  }

  // Filter sensors based on search and status
  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.river?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: sensors.length,
    active: sensors.filter(s => s.status === 'active').length,
    maintenance: sensors.filter(s => s.status === 'maintenance').length,
    inactive: sensors.filter(s => s.status === 'inactive').length,
    avgWqi: sensors
      .filter(s => s.prediction?.nowcast?.wqi || s.latestReading?.wqi_raw)
      .reduce((sum, s) => sum + (s.prediction?.nowcast?.wqi || s.latestReading?.wqi_raw || 0), 0) / 
      sensors.filter(s => s.prediction?.nowcast?.wqi || s.latestReading?.wqi_raw).length || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Peta Sensor</h1>
              <p className="text-gray-600">Monitor kualitas air real-time di Jakarta</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensorList(!showSensorList)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>

              {user?.role === 'admin' && (
                <Button
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Sensor
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Sensor</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Aktif</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Tidak Aktif</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.avgWqi.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Rata-rata WQI</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          {showSensorList && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daftar Sensor</CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Cari sensor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Status Filter */}
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'active', 'maintenance', 'inactive'] as const).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={statusFilter === status ? "default" : "outline"}
                        onClick={() => setStatusFilter(status)}
                        className="text-xs"
                      >
                        {status === 'all' ? 'Semua' :
                         status === 'active' ? 'Aktif' :
                         status === 'maintenance' ? 'Maintenance' : 'Tidak Aktif'}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <SensorList
                    sensors={filteredSensors}
                    selectedSensorId={selectedSensorId}
                    onSensorSelect={setSelectedSensorId}
                  />
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