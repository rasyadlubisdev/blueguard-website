// src/lib/api.ts - Fixed version dengan error prevention & correct typings
import { db } from './firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentReference,
  type UpdateData,
  type FieldValue,
} from 'firebase/firestore'

// ================== TYPES ==================

// Types untuk sensor data yang sesuai dengan ML API
export interface SensorReading {
  id?: string
  sensor_id: string
  timestamp: string
  well_id: string
  // ML Parameters - sesuai dengan API documentation
  ph: number
  ec: number
  co3: number
  hco3: number
  cl: number
  so4: number
  no3: number
  th: number
  ca: number
  mg: number
  na: number
  k: number
  f: number
  tds: number
  // Additional monitoring parameters (tidak masuk ML)
  turbidity?: number
  temperature?: number
  dissolved_oxygen?: number
  // Location
  latitude: number
  longitude: number
  state: string
  district: string
}

export interface Sensor {
  id?: string
  name: string
  location: {
    lat: number
    lng: number
  }
  river?: string
  status: 'active' | 'inactive' | 'maintenance'
  auto_sync: boolean
  user_id: string
  created_at?: Date | null
  updated_at?: Date | null
}

// ML API Response types sesuai dengan FastAPI documentation
export interface MLPredictionResponse {
  sensor_id: string
  task: string
  prediction: {
    wqi: number
    quality_class: string
    confidence: number
    horizon: number
  }
  model_info: {
    name: string
    type: string
    version: string
  }
  status: string
  timestamp: string
  explanations: Record<string, unknown>
}

export interface MLAPIRequest {
  sensor_id: string
  readings: SensorReading[]
  horizon?: number // For forecast endpoint
}

export interface Alert {
  id?: string
  user_id: string // diperlukan karena dipakai pada query getAlerts
  sensor_id: string
  location: string
  type: 'wqi_low' | 'ph_anomaly' | 'turbidity_high' | 'tds_high' | 'sensor_offline'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  triggered_at: Date
  resolved_at?: Date
  acknowledged_by?: string
  status: 'active' | 'acknowledged' | 'resolved'
}

// Health check response interface
export interface HealthCheckResponse {
  status: string
  version: string
  models_loaded: boolean
  uptime: string
  timestamp: string
}

// Prediction storage interface
export interface PredictionRecord {
  sensor_id: string
  timestamp_input: Date
  nowcast?: MLPredictionResponse
  forecast?: MLPredictionResponse
  classification?: MLPredictionResponse
  status: string
}

// Sensor update interface (untuk sanitasi internal)
export interface SensorUpdateData {
  name?: string
  location?: {
    lat: number
    lng: number
  }
  river?: string
  status?: 'active' | 'inactive' | 'maintenance'
  auto_sync?: boolean
  updated_at?: FieldValue // serverTimestamp() menghasilkan FieldValue
}

// Base API URL untuk ML service
// const ML_API_BASE_URL =
//   process.env.NEXT_PUBLIC_ML_API_URL || 'https://rasyadlubisdev-blueguard.hf.space'
const ML_API_BASE_URL = 'http://0.0.0.0:8000'

// ================== SERVICE ==================
class ApiService {
  // ========== ML API INTEGRATION ==========

  /**
   * Health check untuk ML API
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${ML_API_BASE_URL}/healthz`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return (await response.json()) as HealthCheckResponse
    } catch (error) {
      console.error('ML API health check failed:', error)

      // Return mock health status for development
      return {
        status: 'online',
        version: '1.0.0',
        models_loaded: true,
        uptime: '24h',
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Nowcast prediction - prediksi kondisi saat ini
   */
  static async getNowcast(data: MLAPIRequest): Promise<MLPredictionResponse> {
    try {
      if (!data.sensor_id || !data.readings || data.readings.length === 0) {
        throw new Error('Invalid input data for nowcast')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${ML_API_BASE_URL}/nowcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return (await response.json()) as MLPredictionResponse
    } catch (error) {
      console.error('Nowcast API error:', error)
      throw error
    }
  }

  /**
   * Forecast prediction - prediksi masa depan
   */
  static async getForecast(data: MLAPIRequest): Promise<MLPredictionResponse> {
    try {
      if (!data.sensor_id || !data.readings || data.readings.length === 0) {
        throw new Error('Invalid input data for forecast')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${ML_API_BASE_URL}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return (await response.json()) as MLPredictionResponse
    } catch (error) {
      console.error('Forecast API error:', error)
      throw error
    }
  }

  /**
   * Classification - klasifikasi kualitas air
   */
  static async getClassification(data: MLAPIRequest): Promise<MLPredictionResponse> {
    try {
      if (!data.sensor_id || !data.readings || data.readings.length === 0) {
        throw new Error('Invalid input data for classification')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${ML_API_BASE_URL}/classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return (await response.json()) as MLPredictionResponse
    } catch (error) {
      console.error('Classification API error:', error)
      throw error
    }
  }

  // ========== FIRESTORE OPERATIONS ==========

  /**
   * Get all sensors for a user
   */
  static async getSensors(userId: string): Promise<Sensor[]> {
    try {
      const sensorsRef = collection(db, 'sensors')
      const q = query(sensorsRef, where('user_id', '==', userId), orderBy('created_at', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || null,
        updated_at: doc.data().updated_at?.toDate() || null,
      })) as Sensor[]
    } catch (error) {
      console.error('Error fetching sensors:', error)
      throw new Error('Failed to fetch sensors')
    }
  }

  /**
   * Real-time subscription for sensors
   */
  static subscribeSensors(userId: string, callback: (sensors: Sensor[]) => void): () => void {
    try {
      const sensorsRef = collection(db, 'sensors')
      const q = query(sensorsRef, where('user_id', '==', userId), orderBy('created_at', 'desc'))
      
      return onSnapshot(q, (snapshot) => {
        const sensors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || null,
          updated_at: doc.data().updated_at?.toDate() || null,
        })) as Sensor[]
        
        callback(sensors)
      }, (error) => {
        console.error('Error in sensor subscription:', error)
      })
    } catch (error) {
      console.error('Error setting up sensor subscription:', error)
      return () => {} // Return empty cleanup function
    }
  }

  /**
   * Add new sensor
   */
  static async addSensor(sensor: Omit<Sensor, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const sensorsRef = collection(db, 'sensors')
      const docRef = await addDoc(sensorsRef, {
        ...sensor,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding sensor:', error)
      throw new Error('Failed to add sensor')
    }
  }

  /**
   * Update sensor
   */
  static async updateSensor(sensorId: string, updates: SensorUpdateData): Promise<void> {
    try {
      const sensorRef = doc(db, 'sensors', sensorId)
      await updateDoc(sensorRef, {
        ...updates,
        updated_at: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error updating sensor:', error)
      throw new Error('Failed to update sensor')
    }
  }

  /**
   * Delete sensor
   */
  static async deleteSensor(sensorId: string): Promise<void> {
    try {
      const sensorRef = doc(db, 'sensors', sensorId)
      await deleteDoc(sensorRef)
    } catch (error) {
      console.error('Error deleting sensor:', error)
      throw new Error('Failed to delete sensor')
    }
  }

  /**
   * Get sensor readings
   */
  static async getSensorReadings(sensorId: string, limitCount = 100): Promise<SensorReading[]> {
    try {
      const readingsRef = collection(db, 'sensors', sensorId, 'readings')
      const q = query(readingsRef, orderBy('timestamp', 'desc'), limit(limitCount))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SensorReading[]
    } catch (error) {
      console.error('Error fetching sensor readings:', error)
      throw new Error('Failed to fetch sensor readings')
    }
  }

  /**
   * Real-time subscription for sensor readings
   */
  static subscribeReadings(sensorId: string, callback: (readings: SensorReading[]) => void): () => void {
    try {
      const readingsRef = collection(db, 'sensors', sensorId, 'readings')
      const q = query(readingsRef, orderBy('timestamp', 'desc'), limit(100))
      
      return onSnapshot(q, (snapshot) => {
        const readings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as SensorReading[]
        
        callback(readings)
      }, (error) => {
        console.error('Error in readings subscription:', error)
      })
    } catch (error) {
      console.error('Error setting up readings subscription:', error)
      return () => {} // Return empty cleanup function
    }
  }

  /**
   * Add sensor reading
   */
  static async addSensorReading(reading: Omit<SensorReading, 'id'>): Promise<string> {
    try {
      const readingsRef = collection(db, 'sensors', reading.sensor_id, 'readings')
      const docRef = await addDoc(readingsRef, reading)
      return docRef.id
    } catch (error) {
      console.error('Error adding sensor reading:', error)
      throw new Error('Failed to add sensor reading')
    }
  }

  /**
   * Get predictions for a sensor
   */
  static async getPredictions(sensorId: string): Promise<MLPredictionResponse[]> {
    try {
      const predictionsRef = collection(db, 'predictions')
      const q = query(
        predictionsRef, 
        where('sensor_id', '==', sensorId), 
        orderBy('timestamp_input', 'desc'),
        limit(50)
      )
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => doc.data()) as MLPredictionResponse[]
    } catch (error) {
      console.error('Error fetching predictions:', error)
      throw new Error('Failed to fetch predictions')
    }
  }

  /**
   * Save prediction result
   */
  static async savePrediction(prediction: PredictionRecord): Promise<string> {
    try {
      const predictionsRef = collection(db, 'predictions')
      const docRef = await addDoc(predictionsRef, {
        ...prediction,
        created_at: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error saving prediction:', error)
      throw new Error('Failed to save prediction')
    }
  }

  /**
   * Get alerts for a user
   */
  static async getAlerts(userId: string): Promise<Alert[]> {
    try {
      const alertsRef = collection(db, 'alerts')
      const q = query(
        alertsRef, 
        where('user_id', '==', userId), 
        orderBy('triggered_at', 'desc'),
        limit(100)
      )
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        triggered_at: doc.data().triggered_at?.toDate() || new Date(),
        resolved_at: doc.data().resolved_at?.toDate() || undefined,
      })) as Alert[]
    } catch (error) {
      console.error('Error fetching alerts:', error)
      throw new Error('Failed to fetch alerts')
    }
  }

  /**
   * Create new alert
   */
  static async createAlert(alert: Omit<Alert, 'id' | 'triggered_at'>): Promise<string> {
    try {
      const alertsRef = collection(db, 'alerts')
      const docRef = await addDoc(alertsRef, {
        ...alert,
        triggered_at: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating alert:', error)
      throw new Error('Failed to create alert')
    }
  }

  /**
   * Generate alerts based on sensor reading
   */
  static generateAlerts(reading: Partial<SensorReading> & { sensor_id: string; ph: number; tds: number }, location: string): Alert[] {
    const alerts: Alert[] = []

    try {
      // pH alerts
      if (typeof reading.ph === 'number' && !isNaN(reading.ph)) {
        if (reading.ph < 6.5 || reading.ph > 8.5) {
          alerts.push({
            user_id: '',
            sensor_id: reading.sensor_id,
            location,
            type: 'ph_anomaly',
            severity: reading.ph < 5.5 || reading.ph > 9.5 ? 'high' : 'medium',
            message: `pH level (${reading.ph.toFixed(2)}) is outside safe range (6.5-8.5)`,
            status: 'active',
            triggered_at: new Date(),
          })
        }
      }

      // TDS alerts
      if (typeof reading.tds === 'number' && !isNaN(reading.tds) && reading.tds > 500) {
        alerts.push({
          user_id: '',
          sensor_id: reading.sensor_id,
          location,
          type: 'tds_high',
          severity: reading.tds > 1000 ? 'high' : 'medium',
          message: `TDS level (${reading.tds} ppm) is elevated`,
          status: 'active',
          triggered_at: new Date(),
        })
      }

      // Turbidity alerts (jika ada)
      if (typeof reading.turbidity === 'number' && !isNaN(reading.turbidity) && reading.turbidity > 25) {
        alerts.push({
          user_id: '',
          sensor_id: reading.sensor_id,
          location,
          type: 'turbidity_high',
          severity: reading.turbidity > 50 ? 'high' : 'medium',
          message: `Turbidity (${reading.turbidity.toFixed(1)} NTU) is high`,
          status: 'active',
          triggered_at: new Date(),
        })
      }
    } catch (error) {
      console.error('Error generating alerts:', error)
    }

    return alerts
  }

  /**
   * Format data untuk ML API request - Fixed
   */
  static formatForMLAPI(readings: SensorReading[]): MLAPIRequest {
    if (!readings || readings.length === 0) {
      throw new Error('No readings provided')
    }

    try {
      const firstReading = readings[0]
      if (!firstReading.sensor_id) {
        throw new Error('First reading must have a sensor_id')
      }

      return {
        sensor_id: firstReading.sensor_id,
        readings: readings.map((r) => ({
          ...r,
          timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date().toISOString(),
        })),
      }
    } catch (error) {
      console.error('Error formatting for ML API:', error)
      throw error
    }
  }

  /**
   * Export data ke CSV - Fixed with better error handling
   */
  /**
   * Export data ke CSV - Fixed with better error handling and proper typing
   */
  static exportToCSV(data: SensorReading[], filename: string): void {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      if (!filename || typeof filename !== 'string') {
        filename = 'sensor_data'
      }

      const headers = [
        'timestamp',
        'sensor_id',
        'well_id',
        'ph',
        'ec',
        'co3',
        'hco3',
        'cl',
        'so4',
        'no3',
        'th',
        'ca',
        'mg',
        'na',
        'k',
        'f',
        'tds',
        'turbidity',
        'temperature',
        'dissolved_oxygen',
        'latitude',
        'longitude',
        'state',
        'district'
      ] as const

      // Helper function to safely get value from reading object
      const getValue = (reading: SensorReading, key: string): string => {
        switch (key) {
          case 'timestamp': return reading.timestamp || ''
          case 'sensor_id': return reading.sensor_id || ''
          case 'well_id': return reading.well_id || ''
          case 'ph': return reading.ph?.toString() || ''
          case 'ec': return reading.ec?.toString() || ''
          case 'co3': return reading.co3?.toString() || ''
          case 'hco3': return reading.hco3?.toString() || ''
          case 'cl': return reading.cl?.toString() || ''
          case 'so4': return reading.so4?.toString() || ''
          case 'no3': return reading.no3?.toString() || ''
          case 'th': return reading.th?.toString() || ''
          case 'ca': return reading.ca?.toString() || ''
          case 'mg': return reading.mg?.toString() || ''
          case 'na': return reading.na?.toString() || ''
          case 'k': return reading.k?.toString() || ''
          case 'f': return reading.f?.toString() || ''
          case 'tds': return reading.tds?.toString() || ''
          case 'turbidity': return reading.turbidity?.toString() || ''
          case 'temperature': return reading.temperature?.toString() || ''
          case 'dissolved_oxygen': return reading.dissolved_oxygen?.toString() || ''
          case 'latitude': return reading.latitude?.toString() || ''
          case 'longitude': return reading.longitude?.toString() || ''
          case 'state': return reading.state || ''
          case 'district': return reading.district || ''
          default: return ''
        }
      }

      const csvContent = [
        headers.join(','),
        ...data.map((reading) =>
          headers
            .map((header) => {
              const value = getValue(reading, header)
              // Escape commas and quotes in CSV values
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(',')
        ),
      ].join('\n')

      if (typeof window === 'undefined') {
        throw new Error('CSV export is only available in the browser environment')
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      throw new Error(`Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export default ApiService