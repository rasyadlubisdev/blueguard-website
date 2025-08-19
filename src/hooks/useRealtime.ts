// hooks/useRealtime.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { apiService, SensorData, Alert, WQIPrediction } from '@/lib/api'

// Real-time sensor data hook
export function useSensorData(sensorId?: string, enableRealtime = true) {
  const [data, setData] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const initialData = await apiService.getSensorData(sensorId)
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
      const unsubscribe = apiService.subscribeSensorData((newData) => {
        if (mounted) {
          setData(newData)
          setError(null)
        }
      }, sensorId)
      
      unsubscribeRef.current = unsubscribe
    }

    return () => {
      mounted = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [sensorId, enableRealtime])

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const newData = await apiService.getSensorData(sensorId)
      setData(newData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }, [sensorId])

  return { data, loading, error, refresh }
}

// Predictions hook
export function usePredictions(sensorId: string) {
  const [predictions, setPredictions] = useState<WQIPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = useCallback(async () => {
    if (!sensorId) return

    try {
      setLoading(true)
      const data = await apiService.getWQIPredictions(sensorId)
      setPredictions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions')
    } finally {
      setLoading(false)
    }
  }, [sensorId])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  return { predictions, loading, error, refresh: fetchPredictions }
}

// Alerts hook
export function useAlerts(status?: 'active' | 'acknowledged' | 'resolved') {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchAlerts = async () => {
      try {
        setLoading(true)
        const data = await apiService.getAlerts(status)
        if (mounted) {
          setAlerts(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchAlerts()

    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [status])

  const acknowledgeAlert = useCallback(async (alertId: string, userId?: string) => {
    try {
      await apiService.updateAlert(alertId, {
        status: 'acknowledged',
        acknowledged_by: userId
      })
      // Refresh alerts
      const updatedAlerts = await apiService.getAlerts(status)
      setAlerts(updatedAlerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert')
    }
  }, [status])

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await apiService.updateAlert(alertId, { status: 'resolved' })
      // Refresh alerts
      const updatedAlerts = await apiService.getAlerts(status)
      setAlerts(updatedAlerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert')
    }
  }, [status])

  return { alerts, loading, error, acknowledgeAlert, resolveAlert }
}

// Statistics hook
export interface Statistics {
  // Define the expected properties, for example:
  totalSensors: number
  activeAlerts: number
  averageWQI: number
  // Add more fields as needed based on your API response
}

export function useStatistics(timeRange: '1h' | '6h' | '24h' | '7d' = '24h') {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await apiService.getStatistics(timeRange)
        if (mounted) {
          setStats(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [timeRange])

  return { stats, loading, error }
}

// WebSocket hook for real-time updates
export function useWebSocket(url: string, enabled = true) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [lastMessage, setLastMessage] = useState<unknown>(null)

  useEffect(() => {
    if (!enabled || !url) return

    let ws: WebSocket

    const connect = () => {
      setConnectionStatus('connecting')
      ws = new WebSocket(url)

      ws.onopen = () => {
        setConnectionStatus('connected')
        setSocket(ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        setConnectionStatus('disconnected')
        setSocket(null)
        // Reconnect after 3 seconds
        setTimeout(connect, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('disconnected')
      }
    }

    connect()

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [url, enabled])

  const sendMessage = useCallback((message: unknown) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }, [socket])

  return { socket, connectionStatus, lastMessage, sendMessage }
}

// Backend health check hook
export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthy = await apiService.healthCheck()
        setIsHealthy(healthy)
        setLastCheck(new Date())
      } catch (err) {
        setIsHealthy(false)
        setLastCheck(new Date())
      }
    }

    // Initial check
    checkHealth()

    // Check every 2 minutes
    const interval = setInterval(checkHealth, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return { isHealthy, lastCheck }
}

// Geolocation hook for mobile users
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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError('Gagal mendapatkan lokasi: ' + err.message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [])

  return { location, error, loading, getCurrentLocation }
}

// Local storage hook for user preferences
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
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
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}