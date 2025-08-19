// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'
import { 
  Calendar, TrendingUp, TrendingDown, Droplets, 
  AlertTriangle, CheckCircle, Clock, MapPin,
  Activity, BarChart3, PieChart as PieChartIcon,
  Download, Filter, RefreshCw
} from 'lucide-react'

// Mock data - replace with real API calls
const mockSensorData = [
  { time: '00:00', wqi: 75, ph: 7.2, turbidity: 45, tds: 120 },
  { time: '04:00', wqi: 73, ph: 7.1, turbidity: 48, tds: 125 },
  { time: '08:00', wqi: 78, ph: 7.3, turbidity: 42, tds: 115 },
  { time: '12:00', wqi: 72, ph: 7.0, turbidity: 50, tds: 130 },
  { time: '16:00', wqi: 76, ph: 7.2, turbidity: 44, tds: 118 },
  { time: '20:00', wqi: 74, ph: 7.1, turbidity: 47, tds: 122 },
]

const mockPredictionData = [
  { time: 'Now', actual: 75, predicted: null },
  { time: '+1h', actual: null, predicted: 74 },
  { time: '+2h', actual: null, predicted: 73 },
  { time: '+4h', actual: null, predicted: 76 },
  { time: '+8h', actual: null, predicted: 78 },
  { time: '+12h', actual: null, predicted: 72 },
]

const mockRegionData = [
  { name: 'Jakarta Pusat', value: 75, color: '#8884d8' },
  { name: 'Jakarta Utara', value: 68, color: '#82ca9d' },
  { name: 'Jakarta Selatan', value: 82, color: '#ffc658' },
  { name: 'Jakarta Timur', value: 71, color: '#ff7300' },
  { name: 'Jakarta Barat', value: 77, color: '#00ff00' },
]

const mockAlerts = [
  {
    id: 1,
    sensor: 'BGS-001',
    location: 'Cilandak',
    issue: 'pH level tinggi',
    severity: 'high',
    time: '2 jam lalu'
  },
  {
    id: 2,
    sensor: 'BGS-012',
    location: 'Kemayoran',
    issue: 'TDS meningkat',
    severity: 'medium',
    time: '5 jam lalu'
  },
  {
    id: 3,
    sensor: 'BGS-008',
    location: 'Tanjung Priok',
    issue: 'Turbidity tinggi',
    severity: 'high',
    time: '8 jam lalu'
  }
]

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [selectedRegion, setSelectedRegion] = useState('all')

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard BlueGuard</h1>
              <p className="text-gray-600">Monitoring kualitas air real-time di Jakarta</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">1 Jam</option>
                <option value="6h">6 Jam</option>
                <option value="24h">24 Jam</option>
                <option value="7d">7 Hari</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rata-rata WQI</p>
                <p className="text-3xl font-bold text-blue-600">75.2</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +2.1% dari kemarin
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Droplets className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sensor Aktif</p>
                <p className="text-3xl font-bold text-green-600">47/50</p>
                <p className="text-sm text-gray-600">94% uptime</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alert Aktif</p>
                <p className="text-3xl font-bold text-orange-600">3</p>
                <p className="text-sm text-red-600">2 high priority</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-3xl font-bold text-purple-600">0.8s</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  -0.2s dari target
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Real-time WQI Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Water Quality Index - Real-time</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockSensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'wqi' ? 'WQI' : name]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="wqi" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Parameter Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Parameter Trends</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockSensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ph" stroke="#10B981" strokeWidth={2} name="pH" />
                <Line type="monotone" dataKey="turbidity" stroke="#F59E0B" strokeWidth={2} name="Turbidity" />
                <Line type="monotone" dataKey="tds" stroke="#EF4444" strokeWidth={2} name="TDS" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">AI Prediction - Next 12 Hours</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockPredictionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[60, 85]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Actual"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">WQI by Region</h3>
              <PieChartIcon className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockRegionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {mockRegionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select className="text-sm border border-gray-300 rounded px-2 py-1">
                <option>All Severity</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            {mockAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'high' ? 'bg-red-100' : 
                    alert.severity === 'medium' ? 'bg-orange-100' : 'bg-yellow-100'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      alert.severity === 'high' ? 'text-red-600' : 
                      alert.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{alert.issue}</p>
                    <p className="text-sm text-gray-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {alert.sensor} - {alert.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{alert.time}</p>
                  <button className="text-sm text-blue-600 hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}