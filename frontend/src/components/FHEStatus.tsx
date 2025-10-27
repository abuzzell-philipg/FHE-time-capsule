/**
 * FHE Status Component
 * Shows the current status of FHE SDK initialization
 */

import { useState, useEffect } from 'react'
import { useFHE } from '../contexts/FHEContext'

export default function FHEStatus() {
  const { isInitialized, isInitializing, error, initialize } = useFHE()
  const [showSuccess, setShowSuccess] = useState(false)

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (isInitialized) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isInitialized])

  if (isInitializing) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right z-50">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        <span className="text-sm font-medium">Initializing FHE SDK...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-slide-in-right z-50">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">FHE SDK Error</p>
            <p className="text-xs mt-1 opacity-90">{error.message}</p>
            <button
              onClick={initialize}
              className="mt-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isInitialized && showSuccess) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right z-50">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">FHE SDK Ready</span>
      </div>
    )
  }

  return null
}

