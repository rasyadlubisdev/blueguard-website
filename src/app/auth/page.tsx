// src/app/auth/page.tsx - Complete Firebase Auth Implementation
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Droplets, Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth, useNotifications } from '@/components/providers'

// Firebase error messages mapping
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Email tidak terdaftar'
    case 'auth/wrong-password':
      return 'Password salah'
    case 'auth/invalid-email':
      return 'Format email tidak valid'
    case 'auth/user-disabled':
      return 'Akun telah dinonaktifkan'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti'
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar'
    case 'auth/weak-password':
      return 'Password terlalu lemah'
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah'
    case 'auth/popup-closed-by-user':
      return 'Login Google dibatalkan'
    case 'auth/cancelled-popup-request':
      return 'Popup login dibatalkan'
    default:
      return 'Terjadi kesalahan. Silakan coba lagi'
  }
}

export default function AuthPage() {
  const searchParams = useSearchParams()
  const mode = searchParams?.get('mode') || 'signin'
  const [isLogin, setIsLogin] = useState(mode === 'signin')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { signIn, signInWithGoogle, signUp, user, loading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Update form mode based on URL parameter
  useEffect(() => {
    setIsLogin(mode === 'signin')
  }, [mode])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }

    if (!isLogin) {
      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Nama lengkap wajib diisi'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Konfirmasi password wajib diisi'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Password tidak cocok'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password)
        addNotification({
          type: 'success',
          title: 'Login Berhasil',
          message: 'Selamat datang!'
        })
        router.push('/dashboard')
      } else {
        await signUp(formData.email, formData.password, {
          display_name: formData.displayName
        })
        addNotification({
          type: 'success',
          title: 'Registrasi Berhasil',
          message: 'Selamat datang!'
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Auth error:', error)
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi'
      
      // Safely check for Firebase error code
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorMessage = getFirebaseErrorMessage((error as { code: string }).code)
      }
      
      setErrors({ submit: errorMessage })
      addNotification({
        type: 'error',
        title: isLogin ? 'Login Gagal' : 'Registrasi Gagal',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setErrors({})

    try {
      await signInWithGoogle()
      addNotification({
        type: 'success',
        title: 'Login Berhasil',
        message: 'Selamat datang!'
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('Google sign in error:', error)
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi'
      
      // Safely check for Firebase error code
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorMessage = getFirebaseErrorMessage((error as { code: string }).code)
      }
      
      setErrors({ submit: errorMessage })
      addNotification({
        type: 'error',
        title: 'Login Google Gagal',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    })
    setErrors({})
    
    // Update URL without page refresh
    const newMode = isLogin ? 'signup' : 'signin'
    const newUrl = `/auth?mode=${newMode}`
    window.history.pushState({}, '', newUrl)
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Memuat...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Droplets className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BlueGuard</h1>
          <p className="text-gray-600">
            {isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name (Registration only) */}
            {!isLogin && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={`
                      block w-full pl-10 pr-3 py-3 border rounded-lg text-gray-900 placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${errors.displayName ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder="Masukkan nama lengkap"
                    disabled={loading}
                  />
                </div>
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.displayName}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-lg text-gray-900 placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="nama@email.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`
                    block w-full pl-10 pr-10 py-3 border rounded-lg text-gray-900 placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="Masukkan password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password (Registration only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`
                      block w-full pl-10 pr-10 py-3 border rounded-lg text-gray-900 placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder="Konfirmasi password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex justify-center items-center py-3 px-4 
                border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
                bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isLogin ? 'Memuat...' : 'Mendaftar...'}
                </>
              ) : (
                isLogin ? 'Masuk' : 'Daftar'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="
                w-full flex justify-center items-center py-3 px-4 
                border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 
                bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {isLogin ? 'Masuk dengan Google' : 'Daftar dengan Google'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="ml-1 font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Dengan melanjutkan, Anda menyetujui{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Syarat & Ketentuan
            </Link>{' '}
            dan{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Kebijakan Privasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}