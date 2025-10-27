// Contract configuration - TimeCapsule deployed on Sepolia
// 🆕 Updated contract with AES hybrid encryption support
export const CONTRACT_ADDRESS = '0x935596213b7c0EA493959353d032651ff21A7D3F' as `0x${string}`

export const CONTRACT_ABI = [
  // Events
  {
    type: 'event',
    name: 'CapsuleCreated',
    inputs: [
      { name: 'capsuleId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'unlockTime', type: 'uint256', indexed: false },
      { name: 'title', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CapsuleUnlocked',
    inputs: [
      { name: 'capsuleId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
  // Write Functions
  {
    type: 'function',
    name: 'createCapsule',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'encryptedAesKey', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
      { name: 'encryptedContent', type: 'string' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'title', type: 'string' },
    ],
    outputs: [{ name: 'capsuleId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'unlockCapsule',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'capsuleId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // View Functions
  {
    type: 'function',
    name: 'getCapsuleInfo',
    stateMutability: 'view',
    inputs: [{ name: 'capsuleId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'isUnlocked', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getUserCapsules',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'canUnlock',
    stateMutability: 'view',
    inputs: [{ name: 'capsuleId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getRemainingTime',
    stateMutability: 'view',
    inputs: [{ name: 'capsuleId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getTotalCapsules',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getEncryptedContent',
    stateMutability: 'view',
    inputs: [{ name: 'capsuleId', type: 'uint256' }],
    outputs: [{ name: 'encryptedContent', type: 'string' }],
  },
  {
    type: 'function',
    name: 'capsuleCounter',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export interface Capsule {
  id: bigint
  owner: string
  title: string
  unlockTime: bigint
  createdAt: bigint
  isUnlocked: boolean
  remainingTime?: bigint
  canUnlock?: boolean
  encryptedContent?: string  // AES-encrypted content (Base64)
  decryptedMessage?: string   // Decrypted message (after unlock)
}

