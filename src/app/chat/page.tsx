// src/app/chat/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MapPin, BarChart3, Droplets, AlertTriangle } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'chart' | 'map' | 'alert'
}

const suggestedQuestions = [
  "Bagaimana kualitas air di Jakarta Pusat hari ini?",
  "Prediksi WQI untuk 24 jam ke depan",
  "Sensor mana yang menunjukkan anomali?",
  "Rekomendasi tindakan untuk area dengan WQI rendah",
  "Analisis trend kualitas air minggu ini",
  "Status alert tingkat tinggi saat ini"
]

const mockResponses = {
  "kualitas air": "Berdasarkan data real-time dari 47 sensor aktif, kualitas air di Jakarta saat ini menunjukkan rata-rata WQI 75.2. Jakarta Selatan memiliki WQI tertinggi (82), sementara Jakarta Utara perlu perhatian khusus dengan WQI 68.",
  "prediksi": "Model AI kami memprediksi WQI akan mengalami fluktuasi ringan dalam 24 jam ke depan. Pola prediksi menunjukkan penurunan sementara hingga 72 pada pukul 12:00 WIB, kemudian naik kembali ke 78 pada malam hari.",
  "sensor": "Saat ini ada 3 sensor yang menunjukkan anomali: BGS-001 (Cilandak) dengan pH tinggi, BGS-012 (Kemayoran) dengan TDS meningkat, dan BGS-008 (Tanjung Priok) dengan turbidity tinggi.",
  "rekomendasi": "Untuk area dengan WQI rendah, saya merekomendasikan: 1) Tingkatkan frekuensi monitoring, 2) Koordinasi dengan PDAM setempat, 3) Edukasi masyarakat tentang konservasi air, 4) Implementasi filter tambahan jika diperlukan.",
  "trend": "Analisis trend minggu ini menunjukkan stabilitas relatif dengan rata-rata WQI 74.8. Terjadi penurunan 3% pada hari Senin akibat hujan, namun recovery cepat dalam 24 jam.",
  "alert": "Status alert saat ini: 2 alert prioritas tinggi (pH anomaly di Cilandak, turbidity tinggi di Tanjung Priok) dan 1 alert prioritas sedang (TDS elevation di Kemayoran). Tim lapangan sudah diberitahu."
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Halo! Saya BlueGuard AI Assistant. Saya siap membantu Anda menganalisis data kualitas air dan memberikan insights tentang kondisi air di Jakarta. Apa yang ingin Anda ketahui?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue)
      setMessages(prev => [...prev, botResponse])
      setIsLoading(false)
    }, 1500)
  }

  const generateBotResponse = (input: string): Message => {
    const lowercaseInput = input.toLowerCase()
    let responseContent = "Maaf, saya belum sepenuhnya memahami pertanyaan Anda. Bisa Anda coba dengan pertanyaan yang lebih spesifik tentang kualitas air, sensor, atau prediksi?"

    // Simple keyword matching
    for (const [keyword, response] of Object.entries(mockResponses)) {
      if (lowercaseInput.includes(keyword)) {
        responseContent = response
        break
      }
    }

    return {
      id: Date.now().toString(),
      content: responseContent,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">BlueGuard AI Assistant</h1>
              <p className="text-sm text-gray-600">Analisis cerdas untuk monitoring kualitas air</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-[calc(100vh-200px)] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-2xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={`rounded-lg px-4 py-3 ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-2xl">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <p className="text-sm text-gray-500">AI sedang menganalisis...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Pertanyaan yang sering diajukan:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tanyakan tentang kualitas air, prediksi, atau analisis data..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ minHeight: '50px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 mt-3">
            <button 
              onClick={() => handleSuggestedQuestion("Status sensor saat ini")}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Droplets className="w-3 h-3" />
              <span>Status Sensor</span>
            </button>
            <button 
              onClick={() => handleSuggestedQuestion("Lihat dashboard analytics")}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Analytics</span>
            </button>
            <button 
              onClick={() => handleSuggestedQuestion("Lokasi sensor bermasalah")}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <MapPin className="w-3 h-3" />
              <span>Peta Sensor</span>
            </button>
            <button 
              onClick={() => handleSuggestedQuestion("Alert prioritas tinggi")}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Alerts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}