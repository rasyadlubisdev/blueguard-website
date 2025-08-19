// src/components/navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Droplets, Menu, X, User, Settings, LogOut, Map, BarChart3, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/map', label: 'Peta Sensor', icon: <Map className="w-4 h-4" /> },
  { href: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/chat', label: 'AI Assistant', icon: <MessageCircle className="w-4 h-4" /> },
]

export function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  interface User {
    displayName?: string
    // Add other user properties as needed
  }
  const [user, setUser] = useState<User | null>(null) // Replace with actual auth state

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BlueGuard</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user?.displayName || 'User'}</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profil</span>
                    </Link>
                    <button
                      onClick={() => {/* Handle logout */}}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                className="btn-primary"
              >
                Masuk
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile User Section */}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Profil</span>
                    </Link>
                    <button
                      onClick={() => {
                        // Handle logout
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="btn-primary w-full justify-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Masuk
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}