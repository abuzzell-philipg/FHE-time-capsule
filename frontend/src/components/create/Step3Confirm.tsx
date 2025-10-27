import { useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

interface Step3ConfirmProps {
  data: {
    title: string
    content: string
    files: File[]
    unlockTime: Date
  }
  onBack: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export default function Step3Confirm({ data, onBack, onConfirm, isLoading }: Step3ConfirmProps) {
  const [agreed, setAgreed] = useState(false)

  const getTimeDiff = () => {
    const now = new Date()
    const diff = data.unlockTime.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days > 0 ? `${days}d ` : ''}${hours}h`
  }

  // const getTotalSize = () => {
  //   const contentSize = new Blob([data.content]).size
  //   const filesSize = data.files.reduce((acc, file) => acc + file.size, 0)
  //   return formatFileSize(contentSize + filesSize)
  // }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Step 3: Confirm and Create</span>
      </h2>
      
      {/* Summary card */}
      <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Capsule Summary</h3>
        
        <div className="space-y-4">
          {/* Title */}
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Capsule Name</p>
              <p className="font-semibold text-gray-900">{data.title}</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Content Type</p>
              <p className="font-semibold text-gray-900">
                {data.content ? `Text (${data.content.length} chars)` : ''}
                {data.files.length > 0 ? ` + ${data.files.length} file(s)` : ''}
              </p>
              {data.content && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg filter blur-sm hover:blur-none transition-all">
                  <p className="text-sm text-gray-700 italic line-clamp-3">
                    "{data.content.substring(0, 100)}..."
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Unlock time */}
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Unlock Time</p>
              <p className="font-semibold text-gray-900">
                {format(data.unlockTime, 'MMM dd, yyyy HH:mm')}
              </p>
              <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Locked {getTimeDiff()}
              </p>
            </div>
          </div>
          
          {/* Gas fee */}
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Estimated Gas Fee</p>
              <p className="font-semibold text-gray-900">~0.001 ETH</p>
              <p className="text-xs text-gray-500 mt-1">Actual fee determined on-chain</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Warning */}
      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Important Notice</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span>•</span>
                <span>Once created, content <strong>cannot be modified or deleted</strong></span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Content is <strong>invisible to everyone</strong> before unlock time</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Content protected by <strong>FHE encryption</strong> for complete privacy</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Ensure your wallet has enough ETH to pay gas fees</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Confirmation checkbox */}
      <div className="mb-8">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-blue-600 cursor-pointer"
          />
          <span className="text-gray-900 group-hover:text-gray-700 transition-colors">
            I have read and understood the above notice, confirm to create this time capsule
          </span>
        </label>
      </div>
      
      {/* Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </span>
        </button>
        
        <button
          onClick={onConfirm}
          disabled={!agreed || isLoading}
          className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none disabled:grayscale active:scale-95"
        >
          <span className="relative flex items-center gap-3">
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Create Time Capsule</span>
              </>
            )}
          </span>
          {isLoading && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

