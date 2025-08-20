// src/app/profile/page.tsx - User Profile Management
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Camera, Save, Edit3, Mail, Shield, Calendar, 
  MapPin, Phone, Building, Bell, Palette, RefreshCw,
  LogOut, AlertCircle, CheckCircle, Loader2
} from 'lucide-react'
import { useAuth, useNotifications, useTheme } from '@/components/providers'
import { User as UserType, UserPreferences } from '@/types' // Pastikan UserPreferences di-import

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
  // Gunakan tipe yang sudah didefinisikan untuk state
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    phone: '',
    organization: '',
    preferences: {
      theme: 'light', // Hapus 'as const'
      notifications: true,
      default_region: 'jakarta',
      auto_refresh: true,
      alert_sound: true,
      dashboard_layout: 'detailed' // Hapus 'as const'
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
      // Logika ini sekarang aman secara tipe dan tidak akan error
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Pastikan tipe data yang dikirim sesuai dengan yang diharapkan updateUserProfile
      const updatedPreferences: UserPreferences = {
        ...formData.preferences
      };

      await updateUserProfile({
        display_name: formData.display_name,
        phone: formData.phone,
        organization: formData.organization,
        preferences: updatedPreferences
      })

      addNotification({
        type: 'success',
        title: 'Profil Diperbarui',
        message: 'Informasi profil Anda berhasil disimpan'
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update error:', error)
      addNotification({
        type: 'error',
        title: 'Gagal Memperbarui',
        message: 'Terjadi kesalahan saat menyimpan profil'
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
        message: 'Anda telah keluar dari akun'
      })
      router.push('/')
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Logout Gagal',
        message: 'Terjadi kesalahan saat logout'
      })
    }
  }

  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'operator': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'viewer': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-'
    // Pastikan date adalah objek Date yang valid
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    )
  }
  
  // Perluas definisi tipe User agar mencakup semua properti yang mungkin ada
  const safeUser = user as UserType & {
    profile_image?: string;
    photo_url?: string;
    organization?: string;
    phone?: string;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profil Pengguna</h1>
          <p className="text-gray-600 mt-2">Kelola informasi akun dan preferensi Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center">
                {/* Profile Image */}
                <div className="relative inline-block">
                  {safeUser.profile_image || safeUser.photo_url ? (
                    <img
                      src={safeUser.profile_image || safeUser.photo_url}
                      alt={safeUser.display_name || 'User'}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border hover:bg-gray-50 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Basic Info */}
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {safeUser.display_name || 'Pengguna BlueGuard'}
                </h2>
                <p className="text-gray-600">{safeUser.email}</p>
                
                {/* Role Badge */}
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-3 capitalize ${getRoleBadgeColor(safeUser.role)}`}>
                  <Shield className="w-4 h-4 inline mr-1" />
                  {safeUser.role}
                </span>

                {/* Account Info */}
                <div className="mt-6 space-y-3 text-left">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Bergabung: {formatDate(safeUser.created_at)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span>Login terakhir: {formatDate(safeUser.last_login)}</span>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="mt-6 w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Informasi Profil</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profil</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Simpan</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Informasi Pribadi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          id="display_name"
                          name="display_name"
                          value={formData.display_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Nama lengkap"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          id="email"
                          value={safeUser.email}
                          disabled
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor Telepon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="+62 812 3456 7890"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                        Organisasi
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Nama perusahaan/institusi"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Preferensi</h4>
                  <div className="space-y-4">
                    {/* Theme */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Palette className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Tema</p>
                          <p className="text-xs text-gray-500">Pilih tampilan terang atau gelap</p>
                        </div>
                      </div>
                      <select
                        name="preferences.theme"
                        value={formData.preferences.theme}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      >
                        <option value="light">Terang</option>
                        <option value="dark">Gelap</option>
                      </select>
                    </div>

                    {/* Default Region */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Wilayah Default</p>
                          <p className="text-xs text-gray-500">Wilayah yang ditampilkan saat membuka peta</p>
                        </div>
                      </div>
                      <select
                        name="preferences.default_region"
                        value={formData.preferences.default_region}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      >
                        <option value="jakarta">Jakarta</option>
                        <option value="jakarta_pusat">Jakarta Pusat</option>
                        <option value="jakarta_utara">Jakarta Utara</option>
                        <option value="jakarta_selatan">Jakarta Selatan</option>
                        <option value="jakarta_timur">Jakarta Timur</option>
                        <option value="jakarta_barat">Jakarta Barat</option>
                      </select>
                    </div>

                    {/* Dashboard Layout */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Layout Dashboard</p>
                          <p className="text-xs text-gray-500">Tampilan dashboard yang disukai</p>
                        </div>
                      </div>
                      <select
                        name="preferences.dashboard_layout"
                        value={formData.preferences.dashboard_layout}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      >
                        <option value="compact">Kompak</option>
                        <option value="detailed">Detail</option>
                      </select>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Notifikasi</p>
                          <p className="text-xs text-gray-500">Terima notifikasi untuk alert dan pembaruan</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="preferences.notifications"
                          checked={formData.preferences.notifications}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                      </label>
                    </div>

                    {/* Auto Refresh */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Refresh Otomatis</p>
                          <p className="text-xs text-gray-500">Perbarui data secara otomatis</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="preferences.auto_refresh"
                          checked={formData.preferences.auto_refresh}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                      </label>
                    </div>

                    {/* Alert Sound */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Suara Alert</p>
                          <p className="text-xs text-gray-500">Mainkan suara untuk alert penting</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="preferences.alert_sound"
                          checked={formData.preferences.alert_sound}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Aksi Cepat</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      <span>Toggle Tema ({theme})</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh Halaman</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-blue-900">Keamanan Akun</h5>
              <p className="text-sm text-blue-700 mt-1">
                Akun Anda dilindungi dengan Firebase Authentication. 
                Jika Anda mencurigai aktivitas yang tidak biasa, segera logout dan login kembali.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
