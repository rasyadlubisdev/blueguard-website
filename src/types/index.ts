// src/types/index.ts - Enhanced dengan ML integration dan sensor management (FIXED)

// ========== USER & AUTH TYPES ==========
export interface UserPreferences {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  default_region?: string;
  auto_refresh?: boolean;
  alert_sound?: boolean;
  dashboard_layout?: 'compact' | 'detailed';
}

export interface User {
  uid: string;
  role: 'admin' | 'operator' | 'viewer';
  email: string;
  display_name?: string;
  photo_url?: string;
  created_at?: Date;
  last_login?: Date;
  updated_at?: Date;
  preferences?: UserPreferences;
  profile_image?: string;
  phone?: string;
  organization?: string;
}

// ========== SENSOR TYPES ==========
export interface Sensor {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  river?: string;
  status: 'active' | 'inactive' | 'maintenance';
  auto_sync?: boolean;
  user_id?: string;
  district?: string;
  installed_at?: Date;
  meta?: {
    type?: string;
    sampling_rate?: string;
  };
  created_at?: Date;
  updated_at?: Date;
}

// Enhanced sensor reading dengan semua parameter ML
export interface SensorReading {
  id?: string;
  sensor_id: string;
  timestamp: Date | string;
  well_id?: string;

  // ML Parameters - sesuai dengan FastAPI documentation
  ph: number;
  ec: number;                      // Electrical Conductivity
  co3?: number;                     // Carbonate
  hco3?: number;                    // Bicarbonate
  cl?: number;                      // Chloride
  so4?: number;                     // Sulfate
  no3?: number;                     // Nitrate
  th?: number;                      // Total Hardness
  ca?: number;                      // Calcium
  mg?: number;                      // Magnesium
  na?: number;                      // Sodium
  k?: number;                       // Potassium
  f?: number;                       // Fluoride
  tds: number;                      // Total Dissolved Solids

  // Additional monitoring parameters (tidak masuk ML model)
  turbidity?: number;               // Turbidity (NTU)
  temperature?: number;             // Temperature (°C)
  dissolved_oxygen?: number;        // Dissolved Oxygen (mg/L)

  // Location & metadata
  latitude?: number;
  longitude?: number;
  state?: string;
  district?: string;

  // Legacy support
  wqi_raw?: number;
}

// Water reading (alias untuk compatibility)
export type WaterReading = SensorReading;

// ========== ML PREDICTION TYPES ==========
export interface ModelInfo {
  name: string;
  type: 'sklearn' | 'keras_seq' | 'baseline_persistence' | 'arima_recipe';
  version?: string;
  window?: number;
  lead?: number;
}

export interface MLPrediction {
  wqi: number;
  quality_class: string;
  confidence?: number;
  uncertainty?: number;
  model_info: ModelInfo;
}

export interface Prediction {
  id?: string;
  sensor_id: string;
  timestamp_input: Date;
  nowcast?: MLPrediction;
  forecast?: MLPrediction & {
    horizon: number;
  };
  classification?: {
    category: string;
    confidence: number;
    model_info: ModelInfo;
  };
  explanations?: Record<string, unknown>;
  status: 'ok' | 'insufficient_history' | 'error';
  created_at: Date;
}

// ========== ALERT TYPES ==========
export interface Alert {
  id?: string;
  sensor_id: string;
  timestamp: Date;
  type: 'threshold' | 'changepoint' | 'drift' | 'sensor_offline' | 'prediction_alert';
  message: string;
  details: Record<string, unknown>;
  severity: 'info' | 'warn' | 'critical';
  status?: 'active' | 'acknowledged' | 'resolved';
  location?: string;
  acknowledged_by?: string;
  resolved_at?: Date;
}

// ========== MAP & VISUALIZATION TYPES ==========
export interface MarkerData extends Sensor {
  prediction?: Prediction;
  latestReading?: SensorReading;
  alerts?: string[];
  autoSync?: boolean;
  lastUpdate?: Date;
}

export interface SensorFormData {
  name: string;
  lat: number;
  lng: number;
  river?: string;
  type?: string;
  district?: string;
}

// ========== API RESPONSE TYPES ==========
export interface ApiResponse<T> {
  status: 'ok' | 'error' | 'insufficient_history';
  data?: T;
  message?: string;
  error?: string;
}

export interface NowcastResponse {
  status: 'ok' | 'insufficient_history';
  sensor_id: string;
  used_until: string;
  nowcast: {
    wqi: number;
    quality_class: string;
    uncertainty?: number;
  };
  model_info: ModelInfo;
}

export interface ForecastResponse {
  status: 'ok' | 'insufficient_history';
  sensor_id: string;
  used_until: string;
  forecast: Array<{
    h: number;
    wqi: number;
    quality_class: string;
  }>;
  requirements?: {
    min_window: number;
    have_points: number;
  };
  model_info: ModelInfo;
}

// ML API Request/Response types sesuai FastAPI documentation
export interface MLAPIRequest {
  sensor_id: string;
  readings: Array<{
    timestamp: string;
    well_id: string;
    ph: number;
    ec: number;
    co3: number;
    hco3: number;
    cl: number;
    so4: number;
    no3: number;
    th: number;
    ca: number;
    mg: number;
    na: number;
    k: number;
    f: number;
    tds: number;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
  }>;
  horizon?: number; // For forecast endpoint
}

export interface MLAPIResponse {
  sensor_id: string;
  task: string;
  prediction: {
    wqi: number;
    quality_class: string;
    confidence: number;
    horizon: number;
  };
  model_info: {
    name: string;
    type: string;
    version: string;
  };
  status: string;
  timestamp: string;
  explanations: Record<string, unknown>;
}

// ========== CHART DATA TYPES ==========
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesData {
  time: string;
  [key: string]: string | number;
}

// ========== NOTIFICATION TYPES ==========
export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ========== FORM & UI TYPES ==========
export interface FilterOptions {
  status?: 'all' | 'active' | 'inactive' | 'maintenance';
  region?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  searchTerm?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========== DASHBOARD TYPES ==========
export interface DashboardMetrics {
  totalSensors: number;
  activeSensors: number;
  averageWQI: number;
  totalAlerts: number;
  dataPointsToday: number;
  lastUpdate: Date;
}

export interface RegionData {
  name: string;
  value: number;
  sensors: number;
  color: string;
  alerts?: number;
}

// ========== SYSTEM STATUS TYPES ==========
export interface SystemStatus {
  mlAPI: {
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    lastCheck: Date;
  };
  firebase: {
    status: 'connected' | 'disconnected';
    realTimeSync: boolean;
    lastSync: Date;
  };
  sensors: {
    total: number;
    active: number;
    offline: number;
    maintenance: number;
  };
}

// ========== EXPORT TYPES ==========
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateRange: {
    start: Date;
    end: Date;
  };
  sensors?: string[];
  parameters?: string[];
}