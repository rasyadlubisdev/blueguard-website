// lib/api.ts
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
  Timestamp
} from 'firebase/firestore'

// Types
export interface SensorData {
  id: string
  sensor_id: string
  location: {
    lat: number
    lng: number
    name: string
    district: string
  }
  wqi: number
  ph: number
  turbidity: number
  tds: number
  temperature: number
  dissolved_oxygen: number
  conductivity: number
  timestamp: Date
  status: 'online' | 'offline' | 'maintenance'
  battery_level?: number
}

export interface WQIPrediction {
  sensor_id: string
  predictions: {
    h1: number  // 1 hour ahead
    h2: number  // 2 hours ahead
    h4: number  // 4 hours ahead
    h8: number  // 8 hours ahead
    h12: number // 12 hours ahead
    h24: number // 24 hours ahead
  }
  model_confidence: number
  generated_at: Date
}

export interface Alert {
  id: string
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

// Base API URL - replace with your FastAPI backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiService {
  // ========== SENSOR DATA ==========
  
  /**
   * Get real-time sensor data from Firebase
   */
  async getSensorData(sensorId?: string): Promise<SensorData[]> {
    try {
      const sensorsRef = collection(db, 'sensors')
      let q = query(sensorsRef, orderBy('timestamp', 'desc'), limit(100))
      
      if (sensorId) {
        q = query(sensorsRef, where('sensor_id', '==', sensorId), orderBy('timestamp', 'desc'), limit(50))
      }
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as SensorData[]
    } catch (error) {
      console.error('Error fetching sensor data:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time sensor updates
   */
  subscribeSensorData(callback: (data: SensorData[]) => void, sensorId?: string) {
    const sensorsRef = collection(db, 'sensors')
    let q = query(sensorsRef, orderBy('timestamp', 'desc'), limit(100))
    
    if (sensorId) {
      q = query(sensorsRef, where('sensor_id', '==', sensorId), orderBy('timestamp', 'desc'), limit(50))
    }

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as SensorData[]
      callback(data)
    })
  }

  /**
   * Add new sensor reading
   */
  async addSensorReading(data: Omit<SensorData, 'id' | 'timestamp'>): Promise<string> {
    try {
      const sensorsRef = collection(db, 'sensors')
      const docRef = await addDoc(sensorsRef, {
        ...data,
        timestamp: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding sensor reading:', error)
      throw error
    }
  }

  // ========== AI PREDICTIONS ==========
  
  /**
   * Get WQI predictions from FastAPI backend
   */
  async getWQIPredictions(sensorId: string): Promise<WQIPrediction> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict/nowcast-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor_id: sensorId,
          horizon_hours: [1, 2, 4, 8, 12, 24]
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        sensor_id: sensorId,
        predictions: {
          h1: data.forecast?.[0]?.wqi || 0,
          h2: data.forecast?.[1]?.wqi || 0,
          h4: data.forecast?.[2]?.wqi || 0,
          h8: data.forecast?.[3]?.wqi || 0,
          h12: data.forecast?.[4]?.wqi || 0,
          h24: data.forecast?.[5]?.wqi || 0,
        },
        model_confidence: data.model_info?.confidence || 0.8,
        generated_at: new Date()
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
      throw error
    }
  }

  /**
   * Get nowcast (current) prediction
   */
  async getNowcast(sensorId: string): Promise<{ wqi: number; confidence: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict/nowcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sensor_id: sensorId })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        wqi: data.nowcast?.wqi || 0,
        confidence: data.model_info?.confidence || 0.8
      }
    } catch (error) {
      console.error('Error fetching nowcast:', error)
      throw error
    }
  }

  // ========== ALERTS ==========
  
  /**
   * Get active alerts
   */
  async getAlerts(status?: 'active' | 'acknowledged' | 'resolved'): Promise<Alert[]> {
    try {
      const alertsRef = collection(db, 'alerts')
      let q = query(alertsRef, orderBy('triggered_at', 'desc'), limit(50))
      
      if (status) {
        q = query(alertsRef, where('status', '==', status), orderBy('triggered_at', 'desc'), limit(50))
      }
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        triggered_at: doc.data().triggered_at?.toDate() || new Date(),
        resolved_at: doc.data().resolved_at?.toDate()
      })) as Alert[]
    } catch (error) {
      console.error('Error fetching alerts:', error)
      throw error
    }
  }

  /**
   * Create new alert
   */
  async createAlert(alert: Omit<Alert, 'id' | 'triggered_at'>): Promise<string> {
    try {
      const alertsRef = collection(db, 'alerts')
      const docRef = await addDoc(alertsRef, {
        ...alert,
        triggered_at: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating alert:', error)
      throw error
    }
  }

  /**
   * Update alert status
   */
  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<void> {
    try {
      const alertRef = doc(db, 'alerts', alertId)
      await updateDoc(alertRef, {
        ...updates,
        ...(updates.status === 'resolved' && { resolved_at: serverTimestamp() })
      })
    } catch (error) {
      console.error('Error updating alert:', error)
      throw error
    }
  }

  // ========== ANALYTICS ==========
  
  /**
   * Get aggregated statistics
   */
  async getStatistics(timeRange: '1h' | '6h' | '24h' | '7d' = '24h') {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/statistics?range=${timeRange}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching statistics:', error)
      throw error
    }
  }

  /**
   * Get regional WQI data
   */
  async getRegionalData(): Promise<Array<{region: string, avg_wqi: number, sensor_count: number}>> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/regional`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching regional data:', error)
      throw error
    }
  }

  // ========== CHAT/AI ASSISTANT ==========
  
  /**
   * Send message to AI assistant
   */
  async chatWithAI(message: string, context?: Record<string, unknown>): Promise<{ response: string; data?: unknown }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          include_data: true
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error chatting with AI:', error)
      throw error
    }
  }

  // ========== UTILS ==========
  
  /**
   * Health check for backend API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return response.ok
    } catch (error) {
      console.error('Backend health check failed:', error)
      return false
    }
  }

  /**
   * Get sensor locations for map
   */
  async getSensorLocations(): Promise<Array<{
    sensor_id: string
    lat: number
    lng: number
    name: string
    status: string
    last_wqi: number
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/locations`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching sensor locations:', error)
      throw error
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export utility functions
export const formatWQIStatus = (wqi: number): { status: string; color: string; description: string } => {
  if (wqi >= 80) {
    return { status: 'Excellent', color: 'green', description: 'Air berkualitas sangat baik' }
  } else if (wqi >= 70) {
    return { status: 'Good', color: 'blue', description: 'Air berkualitas baik' }
  } else if (wqi >= 60) {
    return { status: 'Fair', color: 'yellow', description: 'Air berkualitas sedang' }
  } else if (wqi >= 40) {
    return { status: 'Poor', color: 'orange', description: 'Air berkualitas buruk' }
  } else {
    return { status: 'Very Poor', color: 'red', description: 'Air berkualitas sangat buruk' }
  }
}

export const getAlertColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'red'
    case 'high': return 'orange' 
    case 'medium': return 'yellow'
    case 'low': return 'blue'
    default: return 'gray'
  }
}