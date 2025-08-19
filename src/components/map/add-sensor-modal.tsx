'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SensorFormData } from '@/types'
import { isValidCoordinate } from '@/lib/utils'

interface AddSensorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: SensorFormData) => void
}

export function AddSensorModal({ isOpen, onClose, onAdd }: AddSensorModalProps) {
  const [formData, setFormData] = useState<SensorFormData>({
    name: '',
    lat: -6.2088,
    lng: 106.8456,
    river: '',
    type: 'IoT Sensor'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lat' || name === 'lng' ? parseFloat(value) || 0 : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama sensor harus diisi'
    }

    if (!isValidCoordinate(formData.lat, formData.lng)) {
      newErrors.coordinates = 'Koordinat tidak valid'
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
      setFormData({
        name: '',
        lat: -6.2088,
        lng: 106.8456,
        river: '',
        type: 'IoT Sensor'
      })
      setErrors({})
    } catch (error) {
      console.error('Failed to add sensor:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Tambah Sensor Baru"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nama Sensor *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Sensor Kali Ciliwung 3"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="river">Nama Sungai/Lokasi</Label>
          <Input
            id="river"
            name="river"
            value={formData.river}
            onChange={handleInputChange}
            placeholder="e.g., Kali Ciliwung"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lat">Latitude *</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              value={formData.lat}
              onChange={handleInputChange}
              placeholder="-6.2088"
              className={errors.coordinates ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="lng">Longitude *</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              value={formData.lng}
              onChange={handleInputChange}
              placeholder="106.8456"
              className={errors.coordinates ? 'border-red-500' : ''}
            />
          </div>
        </div>
        {errors.coordinates && (
          <p className="text-sm text-red-500">{errors.coordinates}</p>
        )}

        <div>
          <Label htmlFor="type">Tipe Sensor</Label>
          <Input
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            placeholder="IoT Sensor"
          />
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>Klik pada peta untuk memilih lokasi atau masukkan koordinat manual</span>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Menambah...' : 'Tambah Sensor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}