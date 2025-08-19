// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Water Quality Classification Utils
export function getWaterQualityColor(classification: string): string {
  const normalizedClass = classification.toLowerCase()
  
  if (normalizedClass.includes('excellent')) return 'water-quality-excellent'
  if (normalizedClass.includes('good')) return 'water-quality-good'
  if (normalizedClass.includes('poor') && !normalizedClass.includes('very')) return 'water-quality-poor'
  if (normalizedClass.includes('very poor')) return 'water-quality-verypoor'
  if (normalizedClass.includes('unsuitable')) return 'water-quality-unsuitable'
  
  return 'bg-gray-500 text-white' // fallback
}

export function getWaterQualityBadgeColor(wqi: number): string {
  if (wqi <= 25) return 'water-quality-excellent'
  if (wqi <= 50) return 'water-quality-good'
  if (wqi <= 75) return 'water-quality-poor'
  if (wqi <= 100) return 'water-quality-verypoor'
  return 'water-quality-unsuitable'
}

export function getWaterQualityText(wqi: number): string {
  if (wqi <= 25) return 'Excellent'
  if (wqi <= 50) return 'Good'
  if (wqi <= 75) return 'Poor'
  if (wqi <= 100) return 'Very Poor yet Drinkable'
  return 'Unsuitable for Drinking'
}

// Format number helpers
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Validation helpers
export function isValidNumber(value: unknown): boolean {
  return !isNaN(Number(value)) && isFinite(Number(value))
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}