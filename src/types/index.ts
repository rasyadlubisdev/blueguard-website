// src/types/index.ts

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

export interface User {
  uid: string
  role: 'admin' | 'operator' | 'viewer'
  email: string
  display_name?: string
  photo_url?: string
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