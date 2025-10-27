import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import Sidebar from '@/components/create/Sidebar'
import StepIndicator from '@/components/create/StepIndicator'
import Step1Upload from '@/components/create/Step1Upload'
import Step2UnlockTime from '@/components/create/Step2UnlockTime'
import Step3Confirm from '@/components/create/Step3Confirm'
import { useTimeCapsule } from '@/hooks/useTimeCapsule'
import { useFHE } from '@/contexts/FHEContext'
import { encryptAesKey } from '@/lib/fhe'
import { encryptMessage as encryptMessageWithAes } from '@/lib/aes'

interface CapsuleData {
  title: string
  content: string
  files: File[]
  unlockTime?: Date
}

export default function Create() {
  const navigate = useNavigate()
  const { isConnected, address } = useAccount()
  const { isInitialized } = useFHE()
  const { createCapsule, isCreating: isContractCreating, isConfirming, isConfirmed, createError } = useTimeCapsule()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [capsuleData, setCapsuleData] = useState<CapsuleData>({
    title: '',
    content: '',
    files: [],
  })
  const [isCreating, setIsCreating] = useState(false)

  // Watch for transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('🎉 Time Capsule Created Successfully!', {
        duration: 4000,
        position: 'top-center',
      })
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    }
  }, [isConfirmed, navigate])

  // Watch for errors
  useEffect(() => {
    if (createError) {
      console.error('Contract error:', createError)
      toast.error(`Creation failed: ${createError.message}`)
      setIsCreating(false)
    }
  }, [createError])

  const handleStep1Next = (data: { title: string; content: string; files: File[] }) => {
    setCapsuleData({ ...capsuleData, ...data })
    setCurrentStep(2)
  }

  const handleStep2Next = (unlockTime: Date) => {
    setCapsuleData({ ...capsuleData, unlockTime })
    setCurrentStep(3)
  }

  const handleConfirm = async () => {
    // 防止重复点击 - 必须先检查再设置状态
    if (isCreating || isContractCreating || isConfirming) {
      console.log('Already creating, ignoring duplicate click')
      return
    }
    
    // ✅ 立即显示加载状态，提升用户体验
    setIsCreating(true)

    if (!capsuleData.unlockTime) {
      toast.error('Please select an unlock time')
      setIsCreating(false)
      return
    }

    if (!capsuleData.content && capsuleData.files.length === 0) {
      toast.error('Please add some content or files')
      setIsCreating(false)
      return
    }

    if (!isInitialized) {
      toast.error('FHE encryption is not initialized yet')
      setIsCreating(false)
      return
    }

    if (!address) {
      toast.error('Please connect your wallet first')
      setIsCreating(false)
      return
    }
    
    try {
      // Step 1: Encrypt message with AES (client-side)
      const contentToEncrypt = capsuleData.content || `File: ${capsuleData.files[0]?.name || 'unknown'}`
      
      toast.loading('🔒 Encrypting your message with AES...', { id: 'aes' })
      const { encryptedContent, aesKeyNumber } = await encryptMessageWithAes(contentToEncrypt)
      toast.success('✅ Message encrypted with AES!', { id: 'aes' })
      
      console.log('AES encryption complete:', {
        encryptedContentLength: encryptedContent.length,
        aesKeyNumber: aesKeyNumber.toString()
      })

      // Step 2: Encrypt AES key with FHE
      toast.loading('🔐 Encrypting AES key with FHE...', { id: 'fhe' })
      const { encryptedAesKey, inputProof } = await encryptAesKey(aesKeyNumber, address)
      toast.success('✅ AES key encrypted with FHE!', { id: 'fhe' })
      
      console.log('FHE encryption complete:', {
        encryptedAesKey,
        proof: inputProof.slice(0, 20) + '...'
      })

      // Step 3: Convert unlock time to Unix timestamp (in seconds)
      const unlockTimestamp = BigInt(Math.floor(capsuleData.unlockTime.getTime() / 1000))

      // Step 4: Call the contract with hybrid encrypted data
      console.log('📝 Calling createCapsule with args:', {
        encryptedAesKey: encryptedAesKey.slice(0, 20) + '...',
        inputProof: inputProof.slice(0, 20) + '...',
        encryptedContent: encryptedContent.slice(0, 50) + '...',
        unlockTimestamp: unlockTimestamp.toString(),
        title: capsuleData.title || 'Untitled Capsule'
      })
      
      toast.loading('📝 Creating time capsule on blockchain...', { id: 'contract' })
      
      createCapsule(
        encryptedAesKey,
        inputProof,
        encryptedContent,
        unlockTimestamp,
        capsuleData.title || 'Untitled Capsule'
      )
      
      console.log('✅ createCapsule function called, waiting for user confirmation...')
      toast.success('⏳ Please confirm transaction in wallet!', { id: 'contract' })
      
    } catch (error: any) {
      console.error('Error creating capsule:', error)
      toast.error(`Failed: ${error.message || 'Unknown error'}`)
      setIsCreating(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Connect Wallet</h2>
          <p className="text-gray-600">You need to connect your wallet to create a time capsule</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <main className="flex-1">
            {/* Page title */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Create Time Capsule
              </h1>
              <p className="text-gray-600">Seal your secrets in time, waiting to be unlocked in the future</p>
            </div>

            {/* Step indicator */}
            <StepIndicator currentStep={currentStep} totalSteps={3} />

            {/* Form card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {currentStep === 1 && <Step1Upload onNext={handleStep1Next} />}
              {currentStep === 2 && (
                <Step2UnlockTime
                  onNext={handleStep2Next}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && capsuleData.unlockTime && (
                <Step3Confirm
                  data={capsuleData as Required<CapsuleData>}
                  onBack={() => setCurrentStep(2)}
                  onConfirm={handleConfirm}
                  isLoading={isCreating || isContractCreating || isConfirming}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

