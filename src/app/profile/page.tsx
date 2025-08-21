// src/app/profile/page.tsx - User Profile Management (FIXED)
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Camera, Save, Edit3, Mail, Shield, Calendar, 
  MapPin, Phone, Building, Bell, Palette, RefreshCw,
  LogOut, AlertCircle, CheckCircle, Loader2
} from 'lucide-react'
import { useAuth, useNotifications, useTheme } from '@/components/providers'
import { User as UserType } from '@/types'

// Definisikan tipe untuk form data agar lebih aman
interface ProfileFormData {
  display_name: string;
  phone: string;
  organization: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    default_region: string;
    auto_refresh: boolean;
    alert_sound: boolean;
    dashboard_layout: 'detailed' | 'compact';
  };
}

export default function ProfilePage() {
  const { user, updateUserProfile, signOut, loading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    phone: '',
    organization: '',
    preferences: {
      theme: 'light',
      notifications: true,
      default_region: 'jakarta',
      auto_refresh: true,
      alert_sound: true,
      dashboard_layout: 'detailed'
    }
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        phone: user.phone || '',
        organization: user.organization || '',
        preferences: {
          theme: user.preferences?.theme || 'light',
          notifications: user.preferences?.notifications ?? true,
          default_region: user.preferences?.default_region || 'jakarta',
          auto_refresh: user.preferences?.auto_refresh ?? true,
          alert_sound: user.preferences?.alert_sound ?? true,
          dashboard_layout: user.preferences?.dashboard_layout || 'detailed'
        }
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name.startsWith('preferences.')) {
      const prefKey = name.replace('preferences.', '') as keyof ProfileFormData['preferences']
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Prepare update data
      const updateData: Partial<UserType> = {
        display_name: formData.display_name,
        phone: formData.phone,
        organization: formData.organization,
        preferences: formData.preferences
      }

      await updateUserProfile(updateData)

      addNotification({
        type: 'success',
        title: 'Profil Diperbarui',
        message: 'Perubahan profil berhasil disimpan'
      })

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memperbarui profil'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      addNotification({
        type: 'success',
        title: 'Logout Berhasil',
        message: 'Anda telah berhasil keluar'
      })
      router.push('/auth')
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal logout'
      })
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        phone: user.phone || '',
        organization: user.organization || '',
        preferences: {
          theme: user.preferences?.theme || 'light',
          notifications: user.preferences?.notifications ?? true,
          default_region: user.preferences?.default_region || 'jakarta',
          auto_refresh: user.preferences?.auto_refresh ?? true,
          alert_sound: user.preferences?.alert_sound ?? true,
          dashboard_layout: user.preferences?.dashboard_layout || 'detailed'
        }
      })
    }
    setIsEditing(false)
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Pengguna</h1>
                <p className="text-sm text-gray-600">Kelola informasi akun dan preferensi Anda</p>
              </div>
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Simpan
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profil
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {formData.display_name || 'Nama belum diatur'}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 capitalize">
                  Role: {user.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Informasi Dasar</h2>
              </div>
              <div className="px-6 py-6 space-y-6">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="display_name"
                        value={formData.display_name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.display_name || '-'}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nomor telepon"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.phone || '-'}</p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisasi
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama organisasi"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.organization || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Info & Preferences */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Info Akun</h2>
              </div>
              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Bergabung</p>
                    <p className="text-sm text-gray-600">
                      {user.created_at?.toLocaleDateString('id-ID') || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Login Terakhir</p>
                    <p className="text-sm text-gray-600">
                      {user.last_login?.toLocaleDateString('id-ID') || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Role</p>
                    <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Preferensi</h2>
              </div>
              <div className="px-6 py-6 space-y-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Theme</p>
                      <p className="text-xs text-gray-500">Mode tampilan aplikasi</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <select
                      name="preferences.theme"
                      value={formData.preferences.theme}
                      onChange={handleInputChange}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  ) : (
                    <button
                      onClick={toggleTheme}
                      className="text-sm text-blue-600 hover:text-blue-800 capitalize"
                    >
                      {theme}
                    </button>
                  )}
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notifikasi</p>
                      <p className="text-xs text-gray-500">Terima notifikasi push</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      name="preferences.notifications"
                      checked={formData.preferences.notifications}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-sm ${formData.preferences.notifications ? 'text-green-600' : 'text-gray-500'}`}>
                      {formData.preferences.notifications ? 'Aktif' : 'Nonaktif'}
                    </span>
                  )}
                </div>

                {/* Auto Refresh */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Auto Refresh</p>
                      <p className="text-xs text-gray-500">Refresh data otomatis</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      name="preferences.auto_refresh"
                      checked={formData.preferences.auto_refresh}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-sm ${formData.preferences.auto_refresh ? 'text-green-600' : 'text-gray-500'}`}>
                      {formData.preferences.auto_refresh ? 'Aktif' : 'Nonaktif'}
                    </span>
                  )}
                </div>

                {/* Alert Sound */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Suara Alert</p>
                      <p className="text-xs text-gray-500">Bunyi notifikasi</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      name="preferences.alert_sound"
                      checked={formData.preferences.alert_sound}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-sm ${formData.preferences.alert_sound ? 'text-green-600' : 'text-gray-500'}`}>
                      {formData.preferences.alert_sound ? 'Aktif' : 'Nonaktif'}
                    </span>
                  )}
                </div>

                {/* Default Region */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Wilayah Default</p>
                      <p className="text-xs text-gray-500">Wilayah default peta</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <select
                      name="preferences.default_region"
                      value={formData.preferences.default_region}
                      onChange={handleInputChange}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="jakarta">Jakarta</option>
                      <option value="bandung">Bandung</option>
                      <option value="surabaya">Surabaya</option>
                      <option value="medan">Medan</option>
                      <option value="semarang">Semarang</option>
                    </select>
                  ) : (
                    <span className="text-sm text-gray-600 capitalize">
                      {formData.preferences.default_region}
                    </span>
                  )}
                </div>

                {/* Dashboard Layout */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Layout Dashboard</p>
                      <p className="text-xs text-gray-500">Tampilan dashboard</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <select
                      name="preferences.dashboard_layout"
                      value={formData.preferences.dashboard_layout}
                      onChange={handleInputChange}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="detailed">Detailed</option>
                      <option value="compact">Compact</option>
                    </select>
                  ) : (
                    <span className="text-sm text-gray-600 capitalize">
                      {formData.preferences.dashboard_layout}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow-sm border border-red-200">
              <div className="px-6 py-4 border-b border-red-200">
                <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
              </div>
              <div className="px-6 py-6">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar dari Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}