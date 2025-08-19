// src/app/page.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Droplets, Shield, BarChart3, MapPin, Zap, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="block">Smart Monitoring</span>
              <span className="block text-blue-200">for Safer Water</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              BlueGuard menggunakan AI dan IoT untuk memantau kualitas air secara real-time, 
              melindungi kesehatan masyarakat Jakarta
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map"
                className="bg-white text-blue-800 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <MapPin className="w-5 h-5" />
                <span>Lihat Peta Sensor</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-800 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Lihat Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Mengapa Memilih BlueGuard?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Solusi terdepan untuk monitoring kualitas air dengan teknologi AI dan IoT
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 text-center hover:shadow-lg transition-shadow duration-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Monitoring</h3>
              <p className="text-gray-600">
                Pantau kualitas air secara real-time dengan sensor IoT yang canggih dan 
                sistem alert otomatis untuk deteksi dini kontaminasi.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 text-center hover:shadow-lg transition-shadow duration-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Prediction</h3>
              <p className="text-gray-600">
                Prediksi kualitas air menggunakan machine learning untuk antisipasi 
                masalah sebelum terjadi dengan akurasi tinggi.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 text-center hover:shadow-lg transition-shadow duration-200">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Focused</h3>
              <p className="text-gray-600">
                Dirancang khusus untuk melayani masyarakat Jakarta dengan fokus pada 
                area dengan tingkat risiko tinggi kontaminasi air.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Dampak BlueGuard
            </h2>
            <p className="text-xl text-gray-600">
              Berkomitmen untuk kesehatan masyarakat Jakarta
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">99.5%</div>
              <div className="text-gray-600">Akurasi Prediksi</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">15</div>
              <div className="text-gray-600">Parameter Air</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">&lt;1min</div>
              <div className="text-gray-600">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Mulai Monitoring Kualitas Air Sekarang
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan BlueGuard untuk memastikan akses air bersih yang aman 
            untuk keluarga dan komunitas Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-white text-blue-800 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Shield className="w-5 h-5" />
              <span>Daftar Sekarang</span>
            </Link>
            <Link
              href="/map"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-800 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Droplets className="w-5 h-5" />
              <span>Explore Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplets className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold text-white">BlueGuard</span>
              </div>
              <p className="text-gray-400">
                Smart water quality monitoring untuk Jakarta yang lebih sehat dan resilient.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/map" className="hover:text-white transition-colors">Peta Sensor</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/chat" className="hover:text-white transition-colors">AI Assistant</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white transition-colors">Bantuan</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Dokumentasi</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Kontak</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BlueGuard. All rights reserved. Made for Hack4Resilient Jakarta.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}