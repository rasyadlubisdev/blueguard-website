// src/types/index.ts - Updated with minimal changes to existing structure

export interface Sensor {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  river?: string
  installed_at?: Date
  meta?: {
    type?: string
    sampling_rate?: string
  }
  status: 'active' | 'inactive' | 'maintenance'
}

export interface WaterReading {
  sensor_id: string
  timestamp: Date
  ph?: number
  ec?: number
  co3?: number
  hco3?: number
  cl?: number
  so4?: number
  no3?: number
  th?: number
  ca?: number
  mg?: number
  na?: number
  k?: number
  f?: number
  tds?: number
  wqi_raw?: number
}

export interface Prediction {
  sensor_id: string
  timestamp_input: Date
  nowcast?: {
    wqi: number
    quality_class: string
    model_info: ModelInfo
  }
  forecast?: {
    horizon: number
    wqi: number
    quality_class: string
    model_info: ModelInfo
  }
  explanations?: Record<string, unknown>
  status: 'ok' | 'insufficient_history' | 'error'
  created_at: Date
}

export interface ModelInfo {
  name: string
  type: 'sklearn' | 'keras_seq' | 'baseline_persistence' | 'arima_recipe'
  version?: string
  window?: number
  lead?: number
}

export interface Alert {
  sensor_id: string
  timestamp: Date
  type: 'threshold' | 'changepoint' | 'drift'
  message: string
  details: Record<string, unknown>
  severity: 'info' | 'warn' | 'critical'
}

// Enhanced User interface with Firebase auth fields
export interface User {
  uid: string
  role: 'admin' | 'operator' | 'viewer'
  email: string
  display_name?: string
  photo_url?: string
  // Additional Firebase/auth fields
  created_at?: Date
  last_login?: Date
  updated_at?: Date
  preferences?: {
    theme?: 'light' | 'dark'
    notifications?: boolean
    default_region?: string
    auto_refresh?: boolean
    alert_sound?: boolean
    dashboard_layout?: 'compact' | 'detailed'
  }
  profile_image?: string
  phone?: string
  organization?: string
}

// API Response Types
export interface ApiResponse<T> {
  status: 'ok' | 'error' | 'insufficient_history'
  data?: T
  message?: string
  error?: string
}

export interface NowcastResponse {
  status: 'ok' | 'insufficient_history'
  sensor_id: string
  used_until: string
  nowcast: {
    wqi: number
    quality_class: string
    uncertainty?: number
  }
  model_info: ModelInfo
}

export interface ForecastResponse {
  status: 'ok' | 'insufficient_history'
  sensor_id: string
  used_until: string
  forecast: Array<{
    h: number
    wqi: number
    quality_class: string
  }>
  requirements?: {
    min_window: number
    have_points: number
  }
  model_info: ModelInfo
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface TimeSeriesData {
  wqi: ChartDataPoint[]
  tds: ChartDataPoint[]
  ph: ChartDataPoint[]
  ec: ChartDataPoint[]
  [key: string]: ChartDataPoint[]
}

// Form Types
export interface SensorFormData {
  name: string
  lat: number
  lng: number
  river?: string
  type?: string
}

export interface ReadingFormData {
  timestamp: Date
  ph?: number
  ec?: number
  co3?: number
  hco3?: number
  cl?: number
  so4?: number
  no3?: number
  th?: number
  ca?: number
  mg?: number
  na?: number
  k?: number
  f?: number
  tds?: number
}

// Map Types
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MarkerData extends Sensor {
  prediction?: Prediction
  latestReading?: WaterReading
}

// Additional types for new components (maintaining compatibility)
export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read?: boolean
  action_url?: string
}

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
    h1: number   // 1 hour ahead
    h2: number   // 2 hours ahead
    h4: number   // 4 hours ahead
    h8: number   // 8 hours ahead
    h12: number  // 12 hours ahead
    h24: number  // 24 hours ahead
  }
  model_confidence: number
  generated_at: Date
}

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'chart' | 'map' | 'alert'
}

// WebSocket Message Types
export interface WebSocketMessage<T = unknown> {
  type: 'sensor_update' | 'alert_new' | 'alert_resolved' | 'system_status' | 'chat_response'
  timestamp: string
  data: T
  sensor_id?: string
}

// Export utility types
export type SensorParameter = 'wqi_raw' | 'ph' | 'turbidity' | 'tds' | 'ec' | 'temperature'
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'
export type UserRole = User['role']
export type AlertSeverity = Alert['severity']
export type SensorStatus = Sensor['status']