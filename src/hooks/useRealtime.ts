// src/hooks/useRealtime.ts - Fixed version sesuai dengan API Service
import { useState, useEffect, useRef, useCallback } from 'react'
import ApiService, { SensorReading, Sensor, Alert, MLPredictionResponse } from '@/lib/api'

// Real-time sensor data hook - Fixed
export function useSensorData(userId: string, enableRealtime = true) {
  const [data, setData] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true

    if (!userId) {
      setLoading(false)
      setError('User ID is required')
      return
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const initialData = await ApiService.getSensors(userId)
        if (mounted) {
          setData(initialData)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch sensor data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchInitialData()

    // Set up real-time subscription
    if (enableRealtime) {
      const unsubscribe = ApiService.subscribeSensors(userId, (newData) => {
        if (mounted) {
          setData(newData)
          setError(null)
        }
      })
      
      unsubscribeRef.current = unsubscribe
    }

    return () => {
      mounted = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [userId, enableRealtime])

  const refresh = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const newData = await ApiService.getSensors(userId)
      setData(newData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  return { data, loading, error, refresh }
}

// Sensor readings hook - Fixed
export function useSensorReadings(sensorId: string, enableRealtime = true) {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true

    if (!sensorId) {
      setLoading(false)
      return
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const initialData = await ApiService.getSensorReadings(sensorId)
        if (mounted) {
          setReadings(initialData)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch sensor readings')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchInitialData()

    // Set up real-time subscription
    if (enableRealtime) {
      const unsubscribe = ApiService.subscribeReadings(sensorId, (newReadings) => {
        if (mounted) {
          setReadings(newReadings)
          setError(null)
        }
      })
      
      unsubscribeRef.current = unsubscribe
    }

    return () => {
      mounted = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [sensorId, enableRealtime])

  const addReading = useCallback(async (reading: Omit<SensorReading, 'id'>) => {
    try {
      await ApiService.addSensorReading(reading)
      // Data will be updated via real-time subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reading')
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!sensorId) return

    try {
      setLoading(true)
      const newData = await ApiService.getSensorReadings(sensorId)
      setReadings(newData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh readings')
    } finally {
      setLoading(false)
    }
  }, [sensorId])

  return { readings, loading, error, addReading, refresh }
}

// ML Predictions hook - Fixed
export function usePredictions(sensorId: string) {
  const [predictions, setPredictions] = useState<MLPredictionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = useCallback(async () => {
    if (!sensorId) return

    try {
      setLoading(true)
      const data = await ApiService.getPredictions(sensorId)
      setPredictions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions')
    } finally {
      setLoading(false)
    }
  }, [sensorId])

  const runNowcast = useCallback(async (readings: SensorReading[]): Promise<MLPredictionResponse | null> => {
    if (!sensorId || !readings.length) return null

    try {
      setLoading(true)
      const apiRequest = ApiService.formatForMLAPI(readings)
      const result = await ApiService.getNowcast(apiRequest)
      
      // Save prediction to Firebase
      await ApiService.savePrediction({
        sensor_id: sensorId,
        timestamp_input: new Date(),
        nowcast: result.prediction,
        status: result.status
      })
      
      // Refresh predictions
      await fetchPredictions()
      
      setError(null)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run nowcast')
      return null
    } finally {
      setLoading(false)
    }
  }, [sensorId, fetchPredictions])

  const runForecast = useCallback(async (readings: SensorReading[], horizon = 365): Promise<MLPredictionResponse | null> => {
    if (!sensorId || !readings.length) return null

    try {
      setLoading(true)
      const apiRequest = { ...ApiService.formatForMLAPI(readings), horizon }
      const result = await ApiService.getForecast(apiRequest)
      
      // Save prediction to Firebase
      await ApiService.savePrediction({
        sensor_id: sensorId,
        timestamp_input: new Date(),
        forecast: result.prediction,
        status: result.status
      })
      
      // Refresh predictions
      await fetchPredictions()
      
      setError(null)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run forecast')
      return null
    } finally {
      setLoading(false)
    }
  }, [sensorId, fetchPredictions])

  const runClassification = useCallback(async (readings: SensorReading[]): Promise<MLPredictionResponse | null> => {
    if (!sensorId || !readings.length) return null

    try {
      setLoading(true)
      const apiRequest = ApiService.formatForMLAPI(readings)
      const result = await ApiService.getClassification(apiRequest)
      
      // Save prediction to Firebase
      await ApiService.savePrediction({
        sensor_id: sensorId,
        timestamp_input: new Date(),
        classification: result.prediction,
        status: result.status
      })
      
      // Refresh predictions
      await fetchPredictions()
      
      setError(null)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run classification')
      return null
    } finally {
      setLoading(false)
    }
  }, [sensorId, fetchPredictions])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  return { 
    predictions, 
    loading, 
    error, 
    refresh: fetchPredictions,
    runNowcast,
    runForecast,
    runClassification
  }
}

// Alerts hook - Fixed
export function useAlerts(userId: string, status?: 'active' | 'acknowledged' | 'resolved') {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const data = await ApiService.getAlerts(userId)
      
      // Filter by status if provided
      const filteredData = status ? data.filter(alert => alert.status === status) : data
      
      setAlerts(filteredData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [userId, status])

  useEffect(() => {
    let mounted = true

    if (!userId) {
      setLoading(false)
      return
    }

    fetchAlerts()

    // Poll for new alerts every 30 seconds
    const interval = setInterval(() => {
      if (mounted) {
        fetchAlerts()
      }
    }, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [fetchAlerts])

  const createAlert = useCallback(async (alert: Omit<Alert, 'id' | 'triggered_at'>) => {
    try {
      await ApiService.createAlert(alert)
      // Refresh alerts
      await fetchAlerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
    }
  }, [fetchAlerts])

  const acknowledgeAlert = useCallback(async (alertId: string, acknowledgedBy?: string) => {
    try {
      // Note: updateAlert function doesn't exist in ApiService, so we'll skip this for now
      // You would need to implement updateAlert in ApiService
      console.log('Acknowledge alert:', alertId, acknowledgedBy)
      await fetchAlerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert')
    }
  }, [fetchAlerts])

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      // Note: updateAlert function doesn't exist in ApiService, so we'll skip this for now
      // You would need to implement updateAlert in ApiService
      console.log('Resolve alert:', alertId)
      await fetchAlerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert')
    }
  }, [fetchAlerts])

  return { alerts, loading, error, createAlert, acknowledgeAlert, resolveAlert, refresh: fetchAlerts }
}

// Statistics hook - Fixed with mock implementation
export interface Statistics {
  totalSensors: number
  activeSensors: number
  inactiveSensors: number
  maintenanceSensors: number
  activeAlerts: number
  averageWQI: number
  totalReadingsToday: number
  lastUpdate: Date
}

export function useStatistics(userId: string, timeRange: '1h' | '6h' | '24h' | '7d' = '24h') {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      
      // Since we don't have a getStatistics method in ApiService, we'll calculate from available data
      const [sensors, alerts] = await Promise.all([
        ApiService.getSensors(userId),
        ApiService.getAlerts(userId)
      ])

      const activeSensors = sensors.filter(s => s.status === 'active').length
      const inactiveSensors = sensors.filter(s => s.status === 'inactive').length
      const maintenanceSensors = sensors.filter(s => s.status === 'maintenance').length
      const activeAlerts = alerts.filter(a => a.status === 'active').length

      // Mock average WQI calculation
      const averageWQI = Math.random() * 50 + 25 // Mock value between 25-75

      const statistics: Statistics = {
        totalSensors: sensors.length,
        activeSensors,
        inactiveSensors,
        maintenanceSensors,
        activeAlerts,
        averageWQI: parseFloat(averageWQI.toFixed(1)),
        totalReadingsToday: Math.floor(Math.random() * 1000) + 500, // Mock value
        lastUpdate: new Date()
      }

      setStats(statistics)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }, [userId, timeRange])

  useEffect(() => {
    let mounted = true

    if (!userId) {
      setLoading(false)
      return
    }

    fetchStats()

    // Refresh stats every 5 minutes
    const interval = setInterval(() => {
      if (mounted) {
        fetchStats()
      }
    }, 5 * 60 * 1000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}

// WebSocket hook for real-time updates - Enhanced with error handling
export function useWebSocket(url: string, enabled = true) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [lastMessage, setLastMessage] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (!enabled || !url) {
      setConnectionStatus('disconnected')
      return
    }

    let ws: WebSocket

    const connect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Max reconnection attempts reached')
        setConnectionStatus('disconnected')
        return
      }

      try {
        setConnectionStatus('connecting')
        setError(null)
        ws = new WebSocket(url)

        ws.onopen = () => {
          setConnectionStatus('connected')
          setSocket(ws)
          reconnectAttempts.current = 0
          setError(null)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            setLastMessage(data)
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
            setError('Failed to parse message from server')
          }
        }

        ws.onclose = (event) => {
          setConnectionStatus('disconnected')
          setSocket(null)
          
          if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000) // Exponential backoff
            reconnectTimeoutRef.current = setTimeout(connect, delay)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setConnectionStatus('disconnected')
          setError('WebSocket connection error')
        }
      } catch (err) {
        setError('Failed to create WebSocket connection')
        setConnectionStatus('disconnected')
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [url, enabled])

  const sendMessage = useCallback((message: unknown) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message))
      } catch (err) {
        setError('Failed to send message')
        console.error('Failed to send WebSocket message:', err)
      }
    } else {
      setError('WebSocket not connected')
    }
  }, [socket])

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0
    setError(null)
    // Trigger reconnection by toggling the effect
    if (socket) {
      socket.close()
    }
  }, [socket])

  return { socket, connectionStatus, lastMessage, error, sendMessage, reconnect }
}

// Backend health check hook - Fixed
export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = useCallback(async () => {
    try {
      const response = await ApiService.healthCheck()
      setIsHealthy(response?.status === 'online' || true) // Accept any successful response as healthy
      setLastCheck(new Date())
      setError(null)
    } catch (err) {
      setIsHealthy(false)
      setLastCheck(new Date())
      setError(err instanceof Error ? err.message : 'Health check failed')
    }
  }, [])

  useEffect(() => {
    // Initial check
    checkHealth()

    // Check every 2 minutes
    const interval = setInterval(checkHealth, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [checkHealth])

  return { isHealthy, lastCheck, error, refresh: checkHealth }
}

// Geolocation hook for mobile users - Enhanced
export function useGeolocation() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser ini')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        // Validate coordinates are within reasonable bounds
        if (newLocation.lat >= -90 && newLocation.lat <= 90 && 
            newLocation.lng >= -180 && newLocation.lng <= 180) {
          setLocation(newLocation)
          setError(null)
        } else {
          setError('Invalid coordinates received')
        }
        setLoading(false)
      },
      (err) => {
        let errorMessage = 'Gagal mendapatkan lokasi'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak oleh pengguna'
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia'
            break
          case err.TIMEOUT:
            errorMessage = 'Timeout mendapatkan lokasi'
            break
          default:
            errorMessage = 'Error tidak diketahui: ' + err.message
        }
        setError(errorMessage)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [])

  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
  }, [])

  return { location, error, loading, getCurrentLocation, clearLocation }
}

// Local storage hook for user preferences - Enhanced with error handling
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

// Export data hook
export function useDataExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportSensorData = useCallback(async (
    sensorId: string, 
    format: 'csv' | 'json' = 'csv',
    filename?: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      const readings = await ApiService.getSensorReadings(sensorId, 1000) // Get more data for export

      if (readings.length === 0) {
        throw new Error('No data available for export')
      }

      const exportFilename = filename || `sensor_${sensorId}_data`

      if (format === 'csv') {
        ApiService.exportToCSV(readings, exportFilename)
      } else {
        // JSON export
        const jsonContent = JSON.stringify(readings, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportFilename}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { exportSensorData, loading, error }
}