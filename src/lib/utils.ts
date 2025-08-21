// src/lib/utils.ts - Enhanced dengan ML utilities dan validation (FIXED)
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SensorReading, MLAPIRequest } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ========== COORDINATE VALIDATION ==========
export function isValidCoordinate(lat: number, lng: number): boolean {
  // Jakarta coordinate bounds (approximate)
  const jakartaBounds = {
    minLat: -6.5,    // Lebih fleksibel ke selatan
    maxLat: -5.8,    // Hingga utara Jakarta  
    minLng: 106.5,   // Dari barat Jakarta
    maxLng: 107.2    // Hingga timur Jakarta
  }

  return (
    lat >= jakartaBounds.minLat &&
    lat <= jakartaBounds.maxLat &&
    lng >= jakartaBounds.minLng &&
    lng <= jakartaBounds.maxLng
  )
}

// ========== WATER QUALITY UTILITIES ==========
export function getWaterQualityText(wqi: number): string {
  if (wqi >= 80) return 'Excellent'
  if (wqi >= 60) return 'Good'
  if (wqi >= 40) return 'Poor'
  if (wqi >= 20) return 'Very Poor'
  return 'Unsuitable'
}

/**
 * Mengembalikan nama kelas CSS Tailwind berdasarkan nilai WQI atau nama klasifikasi.
 * Fungsi ini sekarang dapat menerima string (misal, "Good") atau angka (misal, 75).
 */
export function getWaterQualityColor(quality: number | string): string {
  let category: string;
  if (typeof quality === 'number') {
    category = getWaterQualityText(quality).toLowerCase().replace(' ', '');
  } else {
    category = quality.toLowerCase().replace(' ', '');
  }

  switch (category) {
    case 'excellent':
      return 'water-quality-excellent';
    case 'good':
      return 'water-quality-good';
    case 'poor':
      return 'water-quality-poor';
    case 'verypoor':
      return 'water-quality-verypoor';
    case 'unsuitable':
      return 'water-quality-unsuitable';
    default:
      return 'bg-gray-500 text-white'; // Fallback
  }
}

// ========== DATE FORMATTING ==========
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date"; // Handle invalid date

  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'long':
      options.weekday = 'long';
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    default: // 'short'
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
  }

  return d.toLocaleDateString('id-ID', options);
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";

  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return formatDate(d, 'short');
}

// ========== SENSOR DATA VALIDATION ==========
export function validateSensorReading(reading: Partial<SensorReading>): string[] {
  const errors: string[] = [];

  if (!reading.sensor_id) errors.push('Sensor ID is required');
  if (reading.ph === undefined || reading.ph === null) errors.push('pH value is required');
  if (reading.tds === undefined || reading.tds === null) errors.push('TDS value is required');
  if (reading.ec === undefined || reading.ec === null) errors.push('EC value is required');

  if (reading.ph !== undefined && (reading.ph < 0 || reading.ph > 14)) {
    errors.push('pH must be between 0 and 14');
  }
  if (reading.tds !== undefined && reading.tds < 0) {
    errors.push('TDS cannot be negative');
  }
  if (reading.ec !== undefined && reading.ec < 0) {
    errors.push('EC cannot be negative');
  }
  if (reading.temperature !== undefined && (reading.temperature < -5 || reading.temperature > 50)) {
    errors.push('Temperature must be between -5 and 50°C');
  }
  if (reading.turbidity !== undefined && reading.turbidity < 0) {
    errors.push('Turbidity cannot be negative');
  }
  if (reading.dissolved_oxygen !== undefined && reading.dissolved_oxygen < 0) {
    errors.push('Dissolved oxygen cannot be negative');
  }

  if (reading.latitude !== undefined && reading.longitude !== undefined) {
    if (!isValidCoordinate(reading.latitude, reading.longitude)) {
      errors.push('Coordinates must be within Jakarta bounds');
    }
  }

  return errors;
}

// ========== ML API HELPERS ==========
export function formatForMLAPI(readings: SensorReading[]): MLAPIRequest {
  if (readings.length === 0) {
    throw new Error('No readings provided for ML API');
  }

  const formattedReadings = readings.map(reading => {
    const timestamp = typeof reading.timestamp === 'string' ? reading.timestamp : reading.timestamp.toISOString();
    
    return {
      timestamp,
      well_id: reading.well_id || reading.sensor_id,
      ph: reading.ph,
      ec: reading.ec,
      co3: reading.co3 ?? 12, // Default values for missing parameters
      hco3: reading.hco3 ?? 180,
      cl: reading.cl ?? 25,
      so4: reading.so4 ?? 18,
      no3: reading.no3 ?? 8,
      th: reading.th ?? 220,
      ca: reading.ca ?? 65,
      mg: reading.mg ?? 15,
      na: reading.na ?? 28,
      k: reading.k ?? 5,
      f: reading.f ?? 0.8,
      tds: reading.tds,
      latitude: reading.latitude ?? 0,
      longitude: reading.longitude ?? 0,
      state: reading.state || "DKI Jakarta",
      district: reading.district || "Jakarta"
    };
  });

  return {
    sensor_id: readings[0].sensor_id,
    readings: formattedReadings
  };
}

// ========== WQI CALCULATION (Simplified for Demo) ==========
export function calculateWQI(reading: Partial<SensorReading>): number {
  // Simplified WQI calculation. Replace with your actual formula.
  const weights = {
    ph: 0.25,
    tds: 0.20,
    turbidity: 0.15,
    dissolved_oxygen: 0.15,
  };

  let wqi = 0;
  let totalWeight = 0;

  if (reading.ph !== undefined) {
    let phScore = 100;
    if (reading.ph < 6.5) phScore = Math.max(0, 100 - (6.5 - reading.ph) * 30);
    else if (reading.ph > 8.5) phScore = Math.max(0, 100 - (reading.ph - 8.5) * 30);
    wqi += phScore * weights.ph;
    totalWeight += weights.ph;
  }

  if (reading.tds !== undefined) {
    const tdsScore = Math.max(0, 100 - (reading.tds / 10));
    wqi += tdsScore * weights.tds;
    totalWeight += weights.tds;
  }

  if (reading.turbidity !== undefined) {
    const turbidityScore = Math.max(0, 100 - (reading.turbidity * 2));
    wqi += turbidityScore * weights.turbidity;
    totalWeight += weights.turbidity;
  }

  if (reading.dissolved_oxygen !== undefined) {
    const doScore = Math.min(100, reading.dissolved_oxygen * 16.67);
    wqi += doScore * weights.dissolved_oxygen;
    totalWeight += weights.dissolved_oxygen;
  }

  return totalWeight > 0 ? Math.round(wqi / totalWeight) : 0;
}