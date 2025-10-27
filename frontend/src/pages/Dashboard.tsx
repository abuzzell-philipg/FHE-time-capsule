import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient, useReadContract } from 'wagmi'
import { Clock, Lock, CheckCircle, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getTimeRemaining, formatTimestamp } from '@/lib/utils'
import UnlockModal from '@/components/UnlockModal'
import type { Capsule } from '@/lib/contract'
import { useTimeCapsule } from '@/hooks/useTimeCapsule'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { useFHE } from '@/contexts/FHEContext'
import { decryptEuint64 } from '@/lib/fhe'
import { decryptMessage as decryptMessageWithAes } from '@/lib/aes'

export default function Dashboard() {
  const navigate = useNavigate()
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { userCapsuleIds, refetchUserCapsules } = useTimeCapsule()
  const { instance: fheInstance } = useFHE()
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Component to fetch and display a single capsule
  function CapsuleItem({ capsuleId }: { capsuleId: bigint }) {
    const { data: capsuleData } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getCapsuleInfo',
      args: [capsuleId],
    })

    if (!capsuleData) return null

    // 修复：正确的解构顺序，匹配合约返回值 [owner, unlockTime, createdAt, title, isUnlocked]
    const [owner, unlockTime, createdAt, title, isUnlocked] = capsuleData as readonly [
      `0x${string}`,
      bigint,
      bigint,
      string,
      boolean
    ]
    
    const capsule: Capsule = {
      id: capsuleId,
      owner,
      title,
      unlockTime,
      createdAt,
      isUnlocked,
    }

    return (
      <div
        key={Number(capsule.id)}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-warm hover:shadow-warm-lg transition-all hover:-translate-y-1 cursor-pointer group"
        onClick={() => {
          setSelectedCapsule(capsule)
          setIsModalOpen(true)
        }}
      >
        {/* Status badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">💌</span>
          {capsule.isUnlocked ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Unlocked
            </span>
          ) : (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
              🔒 Locked
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-amber-900 text-lg mb-2 line-clamp-1">
          {capsule.title}
        </h3>

        {/* Info */}
        <div className="space-y-2 text-sm text-amber-700 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {capsule.isUnlocked
                ? 'Unlocked'
                : getTimeRemaining(Number(capsule.unlockTime))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="text-xs">
              Created {formatTimestamp(Number(capsule.createdAt))}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg group-hover:shadow-lg transition-all">
          {capsule.isUnlocked ? 'View Content' : 'View Details'}
        </button>
      </div>
    )
  }

  // Check loading state
  useEffect(() => {
    // Loading is done once we know if there are capsules or not
    setIsLoading(false)
  }, [userCapsuleIds])

  const { unlockCapsule, isUnlocking, isUnlockConfirming, unlockHash } = useTimeCapsule()
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null)

  // Reset decrypted message when modal closes or capsule changes
  useEffect(() => {
    if (!isModalOpen) {
      setDecryptedMessage(null)
    }
  }, [isModalOpen])

  useEffect(() => {
    setDecryptedMessage(null)
  }, [selectedCapsule?.id])

  const handleUnlock = async () => {
    if (!selectedCapsule || !address || !fheInstance || !walletClient || !publicClient) {
      console.error('❌ Missing required parameters:', { 
        hasSelectedCapsule: !!selectedCapsule, 
        hasAddress: !!address,
        hasFheInstance: !!fheInstance,
        hasWalletClient: !!walletClient,
        hasPublicClient: !!publicClient
      })
      return
    }

    try {
      console.log('\n' + '='.repeat(80))
      console.log('🔓 UNLOCKING CAPSULE - Full Flow (Matching Test Script)')
      console.log('='.repeat(80))
      console.log('📋 Capsule ID:', selectedCapsule.id.toString())
      
      // Clear any previous decryption results
      setDecryptedMessage(null)
      
      // ============================================================================
      // STEP 1: 发送解锁交易（修改链上状态）
      // ============================================================================
      console.log('\n[STEP 1] Sending unlock transaction...')
      unlockCapsule(selectedCapsule.id)
      
      // Wait for transaction to be mined (hook will handle this)
      // The decryption will happen in the useEffect when unlockHash is set
      
    } catch (error) {
      console.error('❌ Unlock error:', error)
      setDecryptedMessage(`Error unlocking: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // When unlock transaction is confirmed, decrypt the capsule
  // ✅ 完全按照测试脚本 testTimeCapsule.ts 的流程
  useEffect(() => {
    async function decryptCapsule() {
      // 等待所有必需的状态都准备好
      if (!isUnlockConfirming && !unlockHash) {
        return // 还没开始解锁交易
      }
      
      if (isUnlockConfirming) {
        console.log('[STEP 1] Transaction is confirming...')
        return // 等待交易确认
      }
      
      if (!unlockHash) {
        return // 没有交易哈希
      }
      
      if (!selectedCapsule || !address || !fheInstance || !walletClient || !publicClient) {
        console.error('❌ Missing required parameters for decryption')
        return
      }
      
      try {
        console.log('[STEP 1] ✅ Transaction confirmed!')
        console.log('🔐 Transaction hash:', unlockHash)
        
        // ============================================================================
        // STEP 2: 等待区块链状态更新
        // ============================================================================
        console.log('\n[STEP 2] Waiting for blockchain state to update...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // ============================================================================
        // STEP 3: 使用 staticCall 获取加密的 AES 密钥 handle
        // ============================================================================
        console.log('\n[STEP 3] Getting encrypted AES key handle with simulateContract...')
        console.log('   ⚠️  This is the KEY step - using simulateContract (like test script\'s staticCall)')
        
        const { result: encryptedAesKeyHandle } = await publicClient.simulateContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'unlockCapsule',
          args: [selectedCapsule.id],
          account: address,
        })
        
        console.log('   ✅ Got encrypted AES key handle:', {
          bigint: encryptedAesKeyHandle.toString(),
          hex: '0x' + encryptedAesKeyHandle.toString(16).padStart(64, '0')
        })
        
        // ============================================================================
        // STEP 4: 获取 AES 加密的内容
        // ============================================================================
        console.log('\n[STEP 4] Getting encrypted content from contract...')
        const encryptedContent = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getEncryptedContent',
          args: [selectedCapsule.id],
        }) as string
        
        console.log('   ✅ Got encrypted content:', {
          length: encryptedContent.length,
          preview: encryptedContent.slice(0, 50) + '...'
        })
        
        // ============================================================================
        // STEP 5: FHE 解密 AES 密钥（使用 EIP-712 签名）
        // ============================================================================
        console.log('\n[STEP 5] Decrypting AES key with FHE + EIP-712 signature...')
        console.log('   (This matches test script lines 247-280)')
        
        // 直接使用 viem 的 walletClient 作为 signer
        const signer = walletClient
        
        const aesKeyNumber = await decryptEuint64(
          CONTRACT_ADDRESS as `0x${string}`,
          encryptedAesKeyHandle,
          address,
          signer
        )
        
        console.log('   ✅ AES key decrypted:', {
          value: aesKeyNumber.toString(),
          hex: '0x' + aesKeyNumber.toString(16).padStart(16, '0'),
          type: typeof aesKeyNumber
        })
        
        // ============================================================================
        // STEP 6: 使用 AES 密钥解密内容
        // ============================================================================
        console.log('\n[STEP 6] Decrypting content with AES key (Big-Endian)...')
        const decryptedContent = await decryptMessageWithAes(encryptedContent, aesKeyNumber)
        
        console.log('\n' + '='.repeat(80))
        console.log('🎉 DECRYPTION SUCCESSFUL!')
        console.log('='.repeat(80))
        console.log('📝 Decrypted message:', decryptedContent)
        console.log('='.repeat(80) + '\n')
        
        setDecryptedMessage(decryptedContent)
        
      } catch (error) {
        console.error('\n' + '='.repeat(80))
        console.error('❌ DECRYPTION FAILED')
        console.error('='.repeat(80))
        console.error('Error:', error)
        if (error instanceof Error) {
          console.error('Stack:', error.stack)
        }
        console.error('='.repeat(80) + '\n')
        setDecryptedMessage(`Error decrypting: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    decryptCapsule()
  }, [unlockHash, isUnlockConfirming, selectedCapsule, address, fheInstance, walletClient, publicClient])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Connect Wallet</h2>
          <p className="text-gray-600">You need to connect your wallet to view dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Time Capsules
            </h1>
            <p className="text-gray-600">Manage all your time capsules</p>
          </div>
          <button
            onClick={() => refetchUserCapsules()}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Refresh capsules list"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Refresh</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">All Capsules</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{userCapsuleIds?.length || 0}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Locked</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {/* Will be counted dynamically */}
              -
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Unlocked</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {/* Will be counted dynamically */}
              -
            </p>
          </div>

          <button
            onClick={() => navigate('/create')}
            className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white hover:scale-105 transition-transform shadow-sm hover:shadow-md group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">Create New</h3>
            </div>
            <p className="text-sm opacity-90">Start now →</p>
          </button>
        </div>

        {/* Capsules grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your capsules...</p>
          </div>
        ) : !userCapsuleIds || userCapsuleIds.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Time Capsules Yet</h3>
            <p className="text-gray-600 mb-6">Create your first time capsule to start sealing memories</p>
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Create Time Capsule</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCapsuleIds.map((capsuleId) => (
              <CapsuleItem key={Number(capsuleId)} capsuleId={capsuleId} />
            ))}
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      <UnlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        capsule={selectedCapsule}
        onUnlock={handleUnlock}
        decryptedMessage={decryptedMessage}
        isUnlocking={isUnlocking || isUnlockConfirming}
      />
    </div>
  )
}

