import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'
import { format } from 'date-fns'
import type { Capsule } from '@/lib/contract'

interface UnlockModalProps {
  isOpen: boolean
  onClose: () => void
  capsule: Capsule | null
  onUnlock: () => void
  decryptedMessage?: string | null
  isUnlocking?: boolean
}

type ModalState = 'ready' | 'decrypting' | 'success'

export default function UnlockModal({ isOpen, onClose, capsule, onUnlock, decryptedMessage, isUnlocking }: UnlockModalProps) {
  const [state, setState] = useState<ModalState>('ready')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  useEffect(() => {
    if (isOpen) {
      setState('ready')
      setProgress(0)
    }
  }, [isOpen])

  // Update state when decryption completes
  useEffect(() => {
    if (decryptedMessage && state === 'decrypting') {
      setState('success')
      createConfetti()
    }
  }, [decryptedMessage, state])

  // Show progress when unlocking
  useEffect(() => {
    if (isUnlocking && state === 'ready') {
      setState('decrypting')
    }
  }, [isUnlocking, state])

  const handleUnlock = async () => {
    setState('decrypting')
    setProgress(0)
    
    try {
      // Step 1: 等待用户签名确认
      setProgressText('Waiting for wallet confirmation...')
      setProgress(10)
      
      // 调用实际解锁函数（会触发钱包签名）
      const unlockPromise = onUnlock()
      
      // Step 2: 签名中
      await new Promise(resolve => setTimeout(resolve, 500))
      setProgressText('Confirming transaction...')
      setProgress(30)
      
      // Step 3: 等待解锁完成
      await unlockPromise
      setProgressText('Retrieving encrypted key...')
      setProgress(60)
      
      // Step 4: FHE解密中（等待签名）
      await new Promise(resolve => setTimeout(resolve, 800))
      setProgressText('Decrypting with FHE...')
      setProgress(80)
      
      // Step 5: 等待解密完成
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProgressText('Finalizing...')
      setProgress(100)
      
      // 等待解密结果
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error('Unlock error:', error)
      setState('ready')
      setProgress(0)
      return
    }
  }

  const createConfetti = () => {
    const container = document.getElementById('confetti-container')
    if (!container) return
    
    const colors = [
      'from-amber-400 to-amber-600',
      'from-orange-400 to-orange-600',
      'from-yellow-400 to-yellow-600',
      'from-rose-400 to-rose-600',
      'from-pink-400 to-pink-600',
    ]
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div')
      confetti.className = `absolute w-2 h-2 rounded-full bg-gradient-to-br ${colors[i % colors.length]}`
      confetti.style.left = `${Math.random() * 100}%`
      confetti.style.top = '-10px'
      confetti.style.animation = `fall ${2 + Math.random() * 2}s linear forwards`
      confetti.style.animationDelay = `${Math.random() * 0.5}s`
      container.appendChild(confetti)
      
      setTimeout(() => confetti.remove(), 4000)
    }
  }

  const handleDownload = () => {
    if (!capsule || !decryptedMessage) return

    // 创建文件内容
    const content = `Time Capsule Content
====================

Title: ${capsule.title}
Created: ${format(Number(capsule.createdAt) * 1000, 'yyyy-MM-dd HH:mm:ss')}
Unlocked: ${format(Number(capsule.unlockTime) * 1000, 'yyyy-MM-dd HH:mm:ss')}
Downloaded: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}

Message:
--------
${decryptedMessage}

====================
Secured by FHE (Fully Homomorphic Encryption)
`

    // 创建Blob并下载
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `TimeCapsule_${capsule.title.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!capsule) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-amber-200/50 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 hover:text-gray-900 transition-all hover:scale-110 z-20 shadow-lg flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Ready state */}
            {state === 'ready' && (
              <div className="pt-20 pb-10 px-10">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-amber-900 mb-3 font-display">Capsule Ready to Unlock</h2>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-700">Unlock time reached</span>
                  </div>
                </div>

                {/* Capsule info */}
                <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-amber-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">💌</span>
                    <div>
                      <p className="text-xs text-amber-600 uppercase tracking-wide">Capsule Title</p>
                      <p className="text-xl font-bold text-amber-900">{capsule.title}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-4">
                      <p className="text-xs text-amber-600 mb-1">📅 Created</p>
                      <p className="text-sm text-amber-900 font-medium">
                        {format(Number(capsule.createdAt) * 1000, 'yyyy/MM/dd HH:mm')}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4">
                      <p className="text-xs text-amber-600 mb-1">🎯 Unlock</p>
                      <p className="text-sm text-amber-900 font-medium">
                        {format(Number(capsule.unlockTime) * 1000, 'yyyy/MM/dd HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">🔒 FHE Encryption</p>
                      <p className="text-xs text-amber-700">
                        Content protected by Fully Homomorphic Encryption. Decryption performed entirely on-chain, ensuring complete privacy.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUnlock}
                  disabled={isUnlocking || (state as ModalState) === 'decrypting'}
                  className="w-full group relative py-4 overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl"></div>
                  <div className="relative flex items-center justify-center gap-3 text-white font-bold text-lg">
                    {(isUnlocking || (state as ModalState) === 'decrypting') ? (
                      <>
                        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        <span>🎁 Decrypt Now</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}

            {/* Decrypting state */}
            {state === 'decrypting' && (
              <div className="p-12 text-center">
                <div className="mb-8 flex justify-center">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-2 border-4 border-orange-200 rounded-full animate-spin-reverse"></div>
                    <div className="absolute inset-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/30">
                      <span className="text-5xl">🔓</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-amber-900 mb-4">Decrypting Capsule...</h2>
                <p className="text-amber-700 mb-6">Securely decrypting with FHE, please wait</p>

                <div className="max-w-sm mx-auto">
                  <div className="bg-amber-100 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{progressText}</p>
                </div>
              </div>
            )}

            {/* Success state */}
            {state === 'success' && (
              <div className="pt-20 pb-10 px-10">
                {/* Confetti container */}
                <div id="confetti-container" className="absolute inset-0 pointer-events-none overflow-hidden"></div>

                <div className="text-center mb-10">
                  <h2 className="text-4xl font-bold text-amber-900 mb-4 font-display">🎊 Capsule Revealed!</h2>
                  <p className="text-lg text-green-700">Content successfully decrypted, view your secret from the past</p>
                </div>

                {/* Decrypted content */}
                <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-amber-200/50">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-200">
                    <span className="text-3xl">💌</span>
                    <div>
                      <p className="text-xs text-amber-600 uppercase tracking-wide">Capsule Title</p>
                      <p className="text-xl font-bold text-amber-900">{capsule.title}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border border-amber-200 min-h-[100px]">
                    <p className="text-amber-900 leading-relaxed text-lg whitespace-pre-wrap">
                      {decryptedMessage || 'Decrypting your secret message...'}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-center">
                  <button 
                    onClick={handleDownload}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl"
                  >
                    <Download className="inline w-5 h-5 mr-2" />
                    💾 Download All
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          <style>{`
            @keyframes fall {
              to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

