'use client'

import { useState, useEffect } from 'react'
import { MapPin, Wifi, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SensorFormData } from '@/types'

interface AddSensorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: SensorFormData) => void
  initialLat?: number
  initialLng?: number
}

// Updated coordinate validation untuk Jakarta yang lebih akurat
function isValidJakartaCoordinate(lat: number, lng: number): boolean {
  // Jakarta metropolitan area bounds (lebih luas dan akurat)
  const jakartaBounds = {
    minLat: -6.5,    // Lebih fleksibel ke selatan
    maxLat: -5.8,    // Hingga utara Jakarta
    minLng: 106.5,   // Dari barat Jakarta
    maxLng: 107.2    // Hingga timur Jakarta (termasuk area sekitarnya)
  }

  // Validasi basic range
  if (isNaN(lat) || isNaN(lng)) {
    return false
  }

  // Validasi dalam batas Jakarta yang realistis
  return (
    lat >= jakartaBounds.minLat &&
    lat <= jakartaBounds.maxLat &&
    lng >= jakartaBounds.minLng &&
    lng <= jakartaBounds.maxLng
  )
}

export function AddSensorModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  initialLat, 
  initialLng 
}: AddSensorModalProps) {
  const [formData, setFormData] = useState<SensorFormData>({
    name: '',
    lat: initialLat || -6.2088,
    lng: initialLng || 106.8456,
    river: '',
    type: 'IoT Sensor'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Update form data ketika initial coordinates berubah
  useEffect(() => {
    if (initialLat && initialLng) {
      setFormData(prev => ({
        ...prev,
        lat: initialLat,
        lng: initialLng
      }))
    }
  }, [initialLat, initialLng])

  // Reset form ketika modal dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        lat: initialLat || -6.2088,
        lng: initialLng || 106.8456,
        river: '',
        type: 'IoT Sensor'
      })
      setErrors({})
    }
  }, [isOpen, initialLat, initialLng])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    let processedValue: string | number = value
    
    // Handle numeric fields
    if (name === 'lat' || name === 'lng') {
      processedValue = value === '' ? 0 : parseFloat(value)
      // Validate as user types untuk immediate feedback
      if (value !== '' && !isNaN(parseFloat(value))) {
        const tempLat = name === 'lat' ? parseFloat(value) : formData.lat
        const tempLng = name === 'lng' ? parseFloat(value) : formData.lng
        
        if (!isValidJakartaCoordinate(tempLat, tempLng)) {
          setErrors(prev => ({
            ...prev,
            coordinates: 'Koordinat harus dalam wilayah Jakarta (Lat: -6.5 s/d -5.8, Lng: 106.5 s/d 107.2)'
          }))
        } else {
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.coordinates
            return newErrors
          })
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validasi nama sensor
    if (!formData.name.trim()) {
      newErrors.name = 'Nama sensor harus diisi'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama sensor minimal 3 karakter'
    }

    // Validasi koordinat
    if (!isValidJakartaCoordinate(formData.lat, formData.lng)) {
      newErrors.coordinates = 'Koordinat tidak valid untuk wilayah Jakarta'
    }

    // Validasi optional tapi recommended
    if (!formData.river?.trim()) {
      newErrors.river = 'Nama sungai/lokasi disarankan untuk diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onAdd(formData)
      // Reset form setelah berhasil
      setFormData({
        name: '',
        lat: -6.2088,
        lng: 106.8456,
        river: '',
        type: 'IoT Sensor'
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to add sensor:', error)
      setErrors({
        submit: 'Gagal menambahkan sensor. Silakan coba lagi.'
      })
    } finally {
      setLoading(false)
    }
  }

  const getCoordinateStatus = () => {
    if (isValidJakartaCoordinate(formData.lat, formData.lng)) {
      return {
        valid: true,
        message: 'Koordinat valid untuk Jakarta',
        color: 'text-green-600'
      }
    } else {
      return {
        valid: false,
        message: 'Koordinat di luar wilayah Jakarta',
        color: 'text-red-600'
      }
    }
  }

  const coordinateStatus = getCoordinateStatus()

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Tambah Sensor Baru"
      // size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error umum */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Nama Sensor */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nama Sensor *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Sensor Kali Ciliwung 3"
            className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
            disabled={loading}
            autoFocus
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Nama Sungai/Lokasi */}
        <div className="space-y-2">
          <Label htmlFor="river" className="text-sm font-medium text-gray-700">
            Nama Sungai/Lokasi
          </Label>
          <Input
            id="river"
            name="river"
            value={formData.river}
            onChange={handleInputChange}
            placeholder="e.g., Kali Ciliwung"
            className={errors.river ? 'border-red-500 focus:ring-red-500' : ''}
            disabled={loading}
          />
          {errors.river && (
            <p className="text-sm text-red-600">{errors.river}</p>
          )}
        </div>

        {/* Koordinat */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Koordinat Lokasi *
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat" className="text-xs text-gray-500">
                Latitude
              </Label>
              <Input
                id="lat"
                name="lat"
                type="number"
                step="0.000001"
                value={formData.lat}
                onChange={handleInputChange}
                placeholder="-6.2088"
                className={errors.coordinates ? 'border-red-500 focus:ring-red-500' : ''}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="lng" className="text-xs text-gray-500">
                Longitude
              </Label>
              <Input
                id="lng"
                name="lng"
                type="number"
                step="0.000001"
                value={formData.lng}
                onChange={handleInputChange}
                placeholder="106.8456"
                className={errors.coordinates ? 'border-red-500 focus:ring-red-500' : ''}
                disabled={loading}
              />
            </div>
          </div>

          {/* Status koordinat */}
          <div className={`text-xs ${coordinateStatus.color} flex items-center space-x-1`}>
            <MapPin className="w-3 h-3" />
            <span>{coordinateStatus.message}</span>
          </div>

          {errors.coordinates && (
            <p className="text-sm text-red-600">{errors.coordinates}</p>
          )}
        </div>

        {/* Tipe Sensor */}
        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-medium text-gray-700">
            Tipe Sensor
          </Label>
          <Input
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            placeholder="IoT Sensor"
            disabled={loading}
          />
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Wifi className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Informasi Sensor</p>
              <p className="text-xs text-blue-700 mt-1">
                Sensor akan otomatis disinkronkan dan dapat memulai pengumpulan data setelah ditambahkan.
                Pastikan koordinat berada dalam wilayah Jakarta.
              </p>
            </div>
          </div>
        </div>

        {/* Batas koordinat info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <strong>Batas Koordinat Jakarta:</strong><br />
            Latitude: -6.5 sampai -5.8<br />
            Longitude: 106.5 sampai 107.2
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading || !coordinateStatus.valid}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menambahkan...</span>
              </div>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Tambah Sensor
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}