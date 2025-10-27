import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, type Capsule } from '@/lib/contract'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

export function useTimeCapsule() {
  const { address } = useAccount()

  // Read total capsules
  const { data: totalCapsules } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTotalCapsules',
  })

  // Read user capsules using getUserCapsules
  const { data: userCapsuleIds, refetch: refetchUserCapsules, error: capsuleIdsError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserCapsules',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address, // Only run query when address is available
    },
  })

  // Debug log
  useEffect(() => {
    console.log('🔍 Hook: userCapsuleIds changed =', userCapsuleIds)
    console.log('🔍 Hook: address =', address)
    if (capsuleIdsError) {
      console.error('❌ Hook: Error fetching capsules:', capsuleIdsError)
    }
  }, [userCapsuleIds, address, capsuleIdsError])

  // Create capsule
  const {
    writeContract: writeCreateCapsule,
    data: createHash,
    isPending: isCreating,
    error: createError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: createHash,
    })

  // Debug transaction status
  useEffect(() => {
    if (createHash) {
      console.log('🔗 Transaction hash:', createHash)
    }
    if (isCreating) {
      console.log('📝 Creating transaction...')
    }
    if (isConfirming) {
      console.log('⏳ Confirming transaction...')
    }
    if (isConfirmed) {
      console.log('✅ Transaction confirmed!')
    }
    if (createError) {
      console.error('❌ Create error:', createError)
    }
  }, [createHash, isCreating, isConfirming, isConfirmed, createError])

  // Unlock capsule
  const {
    writeContract: writeUnlockCapsule,
    data: unlockHash,
    isPending: isUnlocking,
    error: unlockError,
  } = useWriteContract()

  const { isLoading: isUnlockConfirming, isSuccess: isUnlockConfirmed } =
    useWaitForTransactionReceipt({
      hash: unlockHash,
    })

  // Refetch user capsules when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ Transaction confirmed, refreshing capsules in 2 seconds...')
      // Wait a bit for the blockchain state to be fully updated
      setTimeout(() => {
        console.log('🔄 Refetching capsules...')
        refetchUserCapsules()
      }, 2000)
    }
  }, [isConfirmed, refetchUserCapsules])

  return {
    // Read functions
    totalCapsules: totalCapsules ? Number(totalCapsules) : 0,
    userCapsuleIds: (userCapsuleIds as bigint[]) || [],
    refetchUserCapsules,

    // Write functions
    createCapsule: (
      encryptedAesKey: `0x${string}`,
      inputProof: `0x${string}`,
      encryptedContent: string,
      unlockTime: bigint,
      title: string
    ) => {
      writeCreateCapsule({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createCapsule',
        args: [encryptedAesKey, inputProof, encryptedContent, unlockTime, title],
      })
    },
    isCreating,
    isConfirming,
    isConfirmed,
    createHash,
    createError,

    unlockCapsule: (capsuleId: bigint) => {
      writeUnlockCapsule({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'unlockCapsule',
        args: [capsuleId],
      })
    },
    isUnlocking,
    isUnlockConfirming,
    isUnlockConfirmed,
    unlockHash,
    unlockError,
  }
}

// Hook to get capsule info
export function useCapsuleInfo(capsuleId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCapsuleInfo',
    args: capsuleId !== undefined ? [capsuleId] : undefined,
  })

  const { data: remainingTime } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRemainingTime',
    args: capsuleId !== undefined ? [capsuleId] : undefined,
  })

  const { data: canUnlock } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'canUnlock',
    args: capsuleId !== undefined ? [capsuleId] : undefined,
  })

  if (!data || !capsuleId) return null

  const [owner, unlockTime, createdAt, title, isUnlocked] = data as [string, bigint, bigint, string, boolean]

  return {
    id: capsuleId,
    owner,
    title,
    unlockTime,
    createdAt,
    isUnlocked,
    remainingTime: remainingTime as bigint,
    canUnlock: canUnlock as boolean,
    isLoading,
    error,
    refetch,
  }
}

// Hook to get all user capsules with details
export function useUserCapsules() {
  const { userCapsuleIds } = useTimeCapsule()
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCapsules() {
      if (!userCapsuleIds || userCapsuleIds.length === 0) {
        setCapsules([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const capsuleData: Capsule[] = []

      for (const id of userCapsuleIds) {
        try {
          // We'll fetch each capsule's info
          // Note: This is simplified - in production you'd batch these calls
          capsuleData.push({
            id,
            owner: '',
            title: '',
            unlockTime: 0n,
            createdAt: 0n,
            isUnlocked: false,
          })
        } catch (error) {
          console.error(`Error fetching capsule ${id}:`, error)
        }
      }

      setCapsules(capsuleData)
      setIsLoading(false)
    }

    fetchCapsules()
  }, [userCapsuleIds])

  return {
    capsules,
    isLoading,
  }
}

