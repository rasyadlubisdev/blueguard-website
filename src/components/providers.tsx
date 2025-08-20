// src/components/providers.tsx - Fixed version with data sanitization
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, FieldValue } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/lib/firebase'
import { User, NotificationItem } from '@/types'

// Auth Context
interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, userData?: Partial<User>) => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility function to remove undefined values with proper typing
const sanitizeData = <T extends object>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
          const cleanedNested = sanitizeData(value as object);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested as T[Extract<keyof T, string>];
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
  }
  
  return cleaned
}


// Auth Provider
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to get user profile from Firestore
  const getUserProfile = async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        // Convert Firestore timestamps to Date objects
        return {
          ...data,
          created_at: data.created_at?.toDate(),
          last_login: data.last_login?.toDate(),
          updated_at: data.updated_at?.toDate()
        } as User
      }
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Helper function to create/update user profile in Firestore
  const createUserProfile = async (firebaseUser: FirebaseUser, additionalData?: Partial<User>): Promise<User> => {
    // Create base user data with a specific type, not 'any'
    const baseUserData: Record<string, unknown> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: (additionalData?.role || 'viewer') as User['role'],
      created_at: serverTimestamp(),
      last_login: serverTimestamp()
    }

    // Add optional fields only if they have values
    if (firebaseUser.displayName || additionalData?.display_name) {
      baseUserData.display_name = firebaseUser.displayName || additionalData?.display_name
    }

    if (firebaseUser.photoURL) {
      baseUserData.photo_url = firebaseUser.photoURL
      baseUserData.profile_image = firebaseUser.photoURL
    }

    if (additionalData?.phone) {
      baseUserData.phone = additionalData.phone
    }

    if (additionalData?.organization) {
      baseUserData.organization = additionalData.organization
    }

    // Add preferences with defaults
    baseUserData.preferences = {
      theme: additionalData?.preferences?.theme || 'light',
      notifications: additionalData?.preferences?.notifications ?? true,
      default_region: additionalData?.preferences?.default_region || 'jakarta',
      auto_refresh: additionalData?.preferences?.auto_refresh ?? true,
      alert_sound: additionalData?.preferences?.alert_sound ?? true,
      dashboard_layout: additionalData?.preferences?.dashboard_layout || 'detailed'
    }

    // Clean the data to remove any undefined values
    const cleanedData = sanitizeData(baseUserData)

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanedData, { merge: true })
      
      // Return user data with Date objects for local state
      return {
        ...cleanedData,
        created_at: new Date(),
        last_login: new Date()
      } as User
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        
        try {
          // Get or create user profile
          let userProfile = await getUserProfile(firebaseUser.uid)
          
          if (!userProfile) {
            userProfile = await createUserProfile(firebaseUser)
          } else {
            // Update last login
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              last_login: serverTimestamp()
            }, { merge: true })
            
            // Update local last_login for state
            userProfile.last_login = new Date()
          }
          
          setUser(userProfile)
        } catch (error) {
          console.error('Error handling user authentication:', error)
          setUser(null)
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData?: Partial<User>) => {
    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await createUserProfile(result.user, userData)
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      throw error
    }
  }

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      // Prepare update data with a specific type, not 'any'
      const updateData: { [key: string]: unknown } = {
        ...data,
        updated_at: serverTimestamp()
      }

      // Clean the data to remove any undefined values before sending to Firestore
      const cleanedData = sanitizeData(updateData)

      await setDoc(doc(db, 'users', user.uid), cleanedData, { merge: true })
      
      // Update local state with Date object
      setUser(prev => prev ? { 
        ...prev, 
        ...data, 
        updated_at: new Date() 
      } : null)
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Theme Provider
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme)
      } else {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setTheme(systemTheme)
      }
    } catch (error) {
      console.error('Error reading theme from localStorage:', error)
    }
  }, [])

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Notification Context
interface NotificationContextType {
  notifications: NotificationItem[]
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Auto remove after 8 seconds for non-critical notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 8000)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    unreadCount
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Main Providers component
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
