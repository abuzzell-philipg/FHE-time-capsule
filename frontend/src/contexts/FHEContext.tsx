/**
 * FHE Context Provider
 * Manages FHE SDK initialization and instance
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { FhevmInstance } from '../types/fhevm'
import { initFHE } from '../lib/fhe'

interface FHEContextValue {
  instance: FhevmInstance | null
  isInitialized: boolean
  isInitializing: boolean
  error: Error | null
  initialize: () => Promise<void>
}

const FHEContext = createContext<FHEContextValue | undefined>(undefined)

interface FHEProviderProps {
  children: ReactNode
}

export function FHEProvider({ children }: FHEProviderProps) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const initialize = async () => {
    if (instance || isInitializing) return

    setIsInitializing(true)
    setError(null)

    try {
      console.log('🔐 Initializing FHE SDK...')
      const fheInstance = await initFHE()
      setInstance(fheInstance as any)
      console.log('✅ FHE SDK ready!')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize FHE')
      setError(error)
      console.error('❌ FHE initialization failed:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  // Auto-initialize when component mounts
  useEffect(() => {
    // Wait for the UMD script to load
    // Try multiple times with increasing delays
    let attempts = 0
    const maxAttempts = 10
    
    const tryInitialize = () => {
      attempts++
      
      // Check if SDK is available
      const sdkNames = ['fhevm', 'zamaRelayerSDK', 'relayerSDK']
      const sdkLoaded = sdkNames.some(name => (window as any)[name])
      
      if (sdkLoaded) {
        initialize()
      } else if (attempts < maxAttempts) {
        // Try again after a delay
        setTimeout(tryInitialize, 200 * attempts)
      } else {
        console.error('❌ FHE SDK failed to load after', maxAttempts, 'attempts')
        setError(new Error('FHE SDK not loaded. Please refresh the page.'))
      }
    }
    
    // Start trying after a short delay
    const timer = setTimeout(tryInitialize, 100)

    return () => clearTimeout(timer)
  }, [])

  const value: FHEContextValue = {
    instance,
    isInitialized: !!instance,
    isInitializing,
    error,
    initialize,
  }

  return <FHEContext.Provider value={value}>{children}</FHEContext.Provider>
}

/**
 * Hook to access FHE context
 */
export function useFHE(): FHEContextValue {
  const context = useContext(FHEContext)
  if (!context) {
    throw new Error('useFHE must be used within FHEProvider')
  }
  return context
}

