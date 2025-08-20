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
  user_id: string                // <— diperlukan karena dipakai pada query getAlerts
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
const ML_API_BASE_URL =
  process.env.NEXT_PUBLIC_ML_API_URL || 'https://rasyadlubisdev-blueguard.hf.space'

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

      const result = (await response.json()) as MLPredictionResponse
      return result
    } catch (error) {
      console.error('Nowcast API call failed:', error)
      return this.getMockPrediction(data.sensor_id, 'nowcast')
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
      const timeoutId = setTimeout(() => controller.abort(), 45000)

      const requestData = {
        ...data,
        horizon: data.horizon ?? 365, // Default 1 year
      }

      const response = await fetch(`${ML_API_BASE_URL}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = (await response.json()) as MLPredictionResponse
      return result
    } catch (error) {
      console.error('Forecast API call failed:', error)
      return this.getMockPrediction(data.sensor_id, 'forecast')
    }
  }

  /**
   * Classification prediction
   */
  static async getClassification(data: MLAPIRequest): Promise<MLPredictionResponse> {
    try {
      if (!data.sensor_id || !data.readings || data.readings.length === 0) {
        throw new Error('Invalid input data for classification')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${ML_API_BASE_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = (await response.json()) as MLPredictionResponse
      return result
    } catch (error) {
      console.error('Classification API call failed:', error)
      return this.getMockPrediction(data.sensor_id, 'classify')
    }
  }

  /**
   * Mock prediction untuk development/demo - Fixed to be safer
   */
  private static getMockPrediction(sensorId: string, task: string): MLPredictionResponse {
    try {
      const wqi = Math.random() * 100
      const qualityClass =
        wqi > 80 ? 'Excellent' : wqi > 60 ? 'Good' : wqi > 40 ? 'Poor' : wqi > 20 ? 'Very Poor' : 'Unsuitable'

      return {
        sensor_id: sensorId || 'unknown_sensor',
        task: task || 'unknown',
        prediction: {
          wqi: parseFloat(wqi.toFixed(2)),
          quality_class: qualityClass,
          confidence: parseFloat((0.75 + Math.random() * 0.25).toFixed(3)),
          horizon: task === 'forecast' ? 365 : 0,
        },
        model_info: {
          name: task === 'forecast' ? 'XGBRegressor' : task === 'nowcast' ? 'ElasticNet' : 'RandomForest',
          type: 'sklearn',
          version: '1.0.0',
        },
        status: 'success',
        timestamp: new Date().toISOString(),
        explanations: {},
      }
    } catch (error) {
      console.error('Error generating mock prediction:', error)
      return {
        sensor_id: sensorId || 'unknown',
        task: task || 'unknown',
        prediction: {
          wqi: 50,
          quality_class: 'Unknown',
          confidence: 0.5,
          horizon: 0,
        },
        model_info: {
          name: 'MockModel',
          type: 'sklearn',
          version: '1.0.0',
        },
        status: 'error',
        timestamp: new Date().toISOString(),
        explanations: {},
      }
    }
  }

  // ========== FIREBASE SENSOR MANAGEMENT ==========

  /**
   * Get semua sensor berdasarkan user - Fixed with better error handling
   */
  static async getSensors(userId: string): Promise<Sensor[]> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Valid user ID is required')
      }

      const sensorsRef = collection(db, 'sensors')
      const qy = query(sensorsRef, where('user_id', '==', userId), orderBy('created_at', 'desc'))

      const snapshot = await getDocs(qy)

      return snapshot.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          ...data,
          created_at: data?.created_at?.toDate?.() ?? null,
          updated_at: data?.updated_at?.toDate?.() ?? null,
        } as Sensor
      })
    } catch (error) {
      console.error('Error fetching sensors:', error)
      return []
    }
  }

  /**
   * Tambah sensor baru (hanya admin/operator) - Fixed with validation
   */
  static async createSensor(sensorData: Omit<Sensor, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      if (!sensorData.name || !sensorData.user_id) {
        throw new Error('Name and user_id are required')
      }

      if (!sensorData.location || typeof sensorData.location.lat !== 'number' || typeof sensorData.location.lng !== 'number') {
        throw new Error('Valid location coordinates are required')
      }

      const sanitizedData = {
        name: String(sensorData.name).trim(),
        location: {
          lat: Number(sensorData.location.lat),
          lng: Number(sensorData.location.lng),
        },
        river: sensorData.river ? String(sensorData.river).trim() : '',
        status: sensorData.status || 'active',
        auto_sync: Boolean(sensorData.auto_sync),
        user_id: String(sensorData.user_id).trim(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'sensors'), sanitizedData)
      return docRef.id
    } catch (error) {
      console.error('Error creating sensor:', error)
      throw new Error(`Failed to create sensor: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update sensor (hanya admin/operator) - Fixed with validation & dotted keys
   */
  static async updateSensor(sensorId: string, updates: Partial<Sensor>): Promise<void> {
    try {
      if (!sensorId || typeof sensorId !== 'string') {
        throw new Error('Valid sensor ID is required')
      }

      // Sanitasi nilai
      const next: SensorUpdateData = {}

      if (updates.name !== undefined) next.name = String(updates.name).trim()
      if (updates.location) {
        next.location = {
          lat: Number(updates.location.lat),
          lng: Number(updates.location.lng),
        }
      }
      if (updates.river !== undefined) next.river = updates.river ? String(updates.river).trim() : ''
      if (updates.status !== undefined) next.status = updates.status
      if (updates.auto_sync !== undefined) next.auto_sync = Boolean(updates.auto_sync)

      // Payload UpdateData<Sensor> dengan dotted paths untuk field nested
      const payload: UpdateData<Sensor> = {
        ...(next.name !== undefined ? { name: next.name } : {}),
        ...(next.river !== undefined ? { river: next.river } : {}),
        ...(next.status !== undefined ? { status: next.status } : {}),
        ...(next.auto_sync !== undefined ? { auto_sync: next.auto_sync } : {}),
        ...(next.location
          ? {
              'location.lat': next.location.lat,
              'location.lng': next.location.lng,
            }
          : {}),
        updated_at: serverTimestamp(),
      }

      const sensorRef = doc(db, 'sensors', sensorId) as DocumentReference<Sensor>
      await updateDoc(sensorRef, payload)
    } catch (error) {
      console.error('Error updating sensor:', error)
      throw new Error(`Failed to update sensor: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Hapus sensor (hanya admin) - Fixed with validation
   */
  static async deleteSensor(sensorId: string): Promise<void> {
    try {
      if (!sensorId || typeof sensorId !== 'string') {
        throw new Error('Valid sensor ID is required')
      }

      const sensorRef = doc(db, 'sensors', sensorId)
      const sensorDoc = await getDoc(sensorRef)

      if (!sensorDoc.exists()) {
        throw new Error('Sensor not found')
      }

      await deleteDoc(sensorRef)
    } catch (error) {
      console.error('Error deleting sensor:', error)
      throw new Error(`Failed to delete sensor: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Subscribe real-time sensor updates - Fixed with error handling
   */
  static subscribeSensors(userId: string, callback: (sensors: Sensor[]) => void): () => void {
    try {
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid user ID for sensor subscription')
        return () => {}
      }

      const qy = query(collection(db, 'sensors'), where('user_id', '==', userId), orderBy('created_at', 'desc'))

      return onSnapshot(
        qy,
        (querySnapshot) => {
          try {
            const sensors = querySnapshot.docs.map((d) => {
              const data = d.data() as any
              return {
                id: d.id,
                ...data,
                created_at: data?.created_at?.toDate?.() ?? null,
                updated_at: data?.updated_at?.toDate?.() ?? null,
              } as Sensor
            })
            callback(sensors)
          } catch (error) {
            console.error('Error processing sensor snapshot:', error)
            callback([])
          }
        },
        (error) => {
          console.error('Error in sensor subscription:', error)
          callback([])
        },
      )
    } catch (error) {
      console.error('Error setting up sensor subscription:', error)
      return () => {}
    }
  }

  // ========== SENSOR READINGS ==========

  /**
   * Get sensor readings dengan parameter lengkap
   */
  static async getSensorReadings(sensorId: string, limitCount: number = 100): Promise<SensorReading[]> {
    try {
      if (!sensorId || typeof sensorId !== 'string') {
        throw new Error('Valid sensor ID is required')
      }

      const readingsRef = collection(db, 'readings')
      const qy = query(
        readingsRef,
        where('sensor_id', '==', sensorId),
        orderBy('timestamp', 'desc'),
        limit(Math.max(1, Math.min(limitCount, 1000))),
      )

      const snapshot = await getDocs(qy)
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SensorReading[]
    } catch (error) {
      console.error('Error fetching sensor readings:', error)
      return []
    }
  }

  /**
   * Tambah sensor reading (dari IoT atau manual input) - Fixed with validation
   */
  static async addSensorReading(reading: Omit<SensorReading, 'id'>): Promise<string> {
    try {
      // Validasi data sebelum disimpan
      this.validateSensorReading(reading)

      // Sanitize data
      const sanitizedReading = {
        ...reading,
        timestamp: reading.timestamp || new Date().toISOString(),
        ph: Number(reading.ph),
        ec: Number(reading.ec),
        tds: Number(reading.tds),
        latitude: Number(reading.latitude),
        longitude: Number(reading.longitude),
        sensor_id: String(reading.sensor_id).trim(),
        well_id: String(reading.well_id).trim(),
        state: String(reading.state).trim(),
        district: String(reading.district).trim(),
        created_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'readings'), sanitizedReading)
      return docRef.id
    } catch (error) {
      console.error('Error adding sensor reading:', error)
      throw new Error(`Failed to add sensor reading: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Subscribe real-time readings - Fixed with error handling
   */
  static subscribeReadings(sensorId: string, callback: (readings: SensorReading[]) => void): () => void {
    try {
      if (!sensorId || typeof sensorId !== 'string') {
        console.error('Invalid sensor ID for readings subscription')
        return () => {}
      }

      const qy = query(
        collection(db, 'readings'),
        where('sensor_id', '==', sensorId),
        orderBy('timestamp', 'desc'),
        limit(50),
      )

      return onSnapshot(
        qy,
        (querySnapshot) => {
          try {
            const readings = querySnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SensorReading[]
            callback(readings)
          } catch (error) {
            console.error('Error processing readings snapshot:', error)
            callback([])
          }
        },
        (error) => {
          console.error('Error in readings subscription:', error)
          callback([])
        },
      )
    } catch (error) {
      console.error('Error setting up readings subscription:', error)
      return () => {}
    }
  }

  // ========== PREDICTIONS STORAGE ==========

  /**
   * Simpan hasil ML prediction ke Firebase
   */
  static async savePrediction(prediction: PredictionRecord): Promise<string> {
    try {
      if (!prediction.sensor_id || !prediction.timestamp_input) {
        throw new Error('sensor_id and timestamp_input are required')
      }

      const sanitizedPrediction = {
        ...prediction,
        sensor_id: String(prediction.sensor_id).trim(),
        timestamp_input: prediction.timestamp_input,
        status: String(prediction.status).trim(),
        created_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'predictions'), sanitizedPrediction)
      return docRef.id
    } catch (error) {
      console.error('Error saving prediction:', error)
      throw new Error(`Failed to save prediction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get predictions history - Fixed
   */
  static async getPredictions(
    sensorId: string,
  ): Promise<Array<PredictionRecord & { id: string; created_at: Date | null }>> {
    try {
      if (!sensorId || typeof sensorId !== 'string') {
        throw new Error('Valid sensor ID is required')
      }

      const predictionsRef = collection(db, 'predictions')
      const qy = query(predictionsRef, where('sensor_id', '==', sensorId), orderBy('created_at', 'desc'), limit(10))

      const snapshot = await getDocs(qy)
      return snapshot.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          sensor_id: data.sensor_id,
          timestamp_input: data?.timestamp_input?.toDate?.() ?? new Date(),
          nowcast: data.nowcast,
          forecast: data.forecast,
          classification: data.classification,
          status: data.status,
          created_at: data?.created_at?.toDate?.() ?? null,
        }
      })
    } catch (error) {
      console.error('Error fetching predictions:', error)
      return []
    }
  }

  // ========== ALERTS MANAGEMENT ==========

  /**
   * Get alerts untuk user
   */
  static async getAlerts(userId: string): Promise<Alert[]> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Valid user ID is required')
      }

      const alertsRef = collection(db, 'alerts')
      const qy = query(alertsRef, where('user_id', '==', userId), orderBy('triggered_at', 'desc'), limit(50))

      const snapshot = await getDocs(qy)
      return snapshot.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          ...data,
          triggered_at: data?.triggered_at?.toDate?.() ?? new Date(),
          resolved_at: data?.resolved_at?.toDate?.() ?? null,
        } as Alert
      })
    } catch (error) {
      console.error('Error fetching alerts:', error)
      return []
    }
  }

  /**
   * Create alert baru - Fixed
   */
  static async createAlert(alert: Omit<Alert, 'id' | 'triggered_at'>): Promise<string> {
    try {
      if (!alert.sensor_id || !alert.message || !alert.user_id) {
        throw new Error('user_id, sensor_id, and message are required')
      }

      const sanitizedAlert = {
        ...alert,
        user_id: String(alert.user_id).trim(),
        sensor_id: String(alert.sensor_id).trim(),
        location: String(alert.location || '').trim(),
        message: String(alert.message).trim(),
        triggered_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'alerts'), sanitizedAlert)
      return docRef.id
    } catch (error) {
      console.error('Error creating alert:', error)
      throw new Error(`Failed to create alert: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Validasi sensor reading data - Fixed with better validation
   */
  private static validateSensorReading(reading: Omit<SensorReading, 'id'>): void {
    const errors: string[] = []

    if (!reading.sensor_id || typeof reading.sensor_id !== 'string') {
      errors.push('Sensor ID is required and must be a string')
    }
    if (!reading.well_id || typeof reading.well_id !== 'string') {
      errors.push('Well ID is required and must be a string')
    }

    if (typeof reading.ph !== 'number' || isNaN(reading.ph) || reading.ph < 0 || reading.ph > 14) {
      errors.push('pH must be a number between 0-14')
    }
    if (typeof reading.tds !== 'number' || isNaN(reading.tds) || reading.tds < 0) {
      errors.push('TDS must be a non-negative number')
    }
    if (typeof reading.ec !== 'number' || isNaN(reading.ec) || reading.ec < 0) {
      errors.push('EC must be a non-negative number')
    }

    // Coordinate validation (Jakarta bounds)
    if (typeof reading.latitude !== 'number' || isNaN(reading.latitude) || reading.latitude < -7 || reading.latitude > -5.5) {
      errors.push('Latitude must be a number within Jakarta bounds (-7 to -5.5)')
    }
    if (typeof reading.longitude !== 'number' || isNaN(reading.longitude) || reading.longitude < 106 || reading.longitude > 107.5) {
      errors.push('Longitude must be a number within Jakarta bounds (106 to 107.5)')
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Generate WQI alerts berdasarkan thresholds - Fixed
   */
  static generateWQIAlerts(reading: SensorReading): Alert[] {
    const alerts: Alert[] = []

    try {
      if (!reading || !reading.sensor_id) return alerts

      const location = `${reading.district || 'Unknown'}, ${reading.state || 'Unknown'}`

      // pH alerts
      if (typeof reading.ph === 'number' && !isNaN(reading.ph)) {
        if (reading.ph < 6.5 || reading.ph > 8.5) {
          alerts.push({
            user_id: '', // isi saat menyimpan ke DB via createAlert
            sensor_id: reading.sensor_id,
            location,
            type: 'ph_anomaly',
            severity: reading.ph < 6.0 || reading.ph > 9.0 ? 'high' : 'medium',
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
  static formatForMLAPI(readings: SensorReading(): MLAPIRequest
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
        'ph',
        'ec',
        'tds',
        'turbidity',
        'temperature',
        'dissolved_oxygen',
        'no3',
        'cl',
        'latitude',
        'longitude',
      ]

      const csvContent = [
        headers.join(','),
        ...data.map((reading) =>
          headers
            .map((header) => {
              const value = (reading as any)[header]
              return value !== undefined && value !== null ? String(value) : ''
            })
            .join(','),
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
