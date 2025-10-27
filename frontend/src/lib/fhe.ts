/**
 * FHE Encryption utilities using Zama SDK (UMD version)
 * SDK loaded via CDN script tag in index.html
 */

import type { FhevmInstance, FhevmConfig } from '../types/fhevm'
import { CONTRACT_ADDRESS } from './contract'

let fhevmInstance: FhevmInstance | null = null

/**
 * Get SDK from window (supports multiple possible global names)
 */
function getSDK() {
  const possibleNames = [
    'fhevm',
    'zamaRelayerSDK',
    'relayerSDK',
    'ZamaRelayerSDK',
    'RelayerSDK'
  ]
  
  for (const name of possibleNames) {
    if ((window as any)[name]) {
      console.log(`✅ Found SDK: window.${name}`)
      return (window as any)[name]
    }
  }
  
  console.error('❌ SDK not found. Available globals:', 
    Object.keys(window).filter(k => k.toLowerCase().includes('sdk') || k.toLowerCase().includes('zama')))
  return null
}

/**
 * Initialize FHE SDK
 * Must be called before using any encryption functions
 */
export async function initFHE(): Promise<FhevmInstance> {
  if (fhevmInstance) {
    return fhevmInstance
  }

  // Get SDK module
  const sdk = getSDK()
  if (!sdk) {
    throw new Error('FHE SDK not loaded. Make sure the script tag is in index.html')
  }

  // Initialize WASM
  await sdk.initSDK()
  console.log('✅ FHE SDK WASM initialized')

  // Create instance with network-specific config
  if (!window.ethereum) {
    throw new Error('MetaMask not detected. Please install MetaMask.')
  }

  // Detect network and use appropriate config
  const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
  const chainIdNumber = parseInt(chainId, 16)
  
  console.log('🌐 Detected chain ID:', chainIdNumber)
  
  let baseConfig
  if (chainIdNumber === 31337 || chainIdNumber === 1337) {
    // Local network (Hardhat or Ganache)
    console.log('🏠 Using LocalhostConfig for local network')
    baseConfig = sdk.LocalhostConfig || {
      networkUrl: 'http://localhost:8545',
      kmsContractAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // Default localhost KMS
      gatewayUrl: 'http://localhost:9002',  // Local KMS Gateway
    }
  } else if (chainIdNumber === 11155111) {
    // Sepolia testnet
    console.log('🌐 Using SepoliaConfig for Sepolia testnet')
    baseConfig = sdk.SepoliaConfig
  } else if (chainIdNumber === 10143) {
    // Fhenix Helium testnet
    console.log('🌐 Using Fhenix Helium testnet')
    baseConfig = sdk.FhenixHeliumConfig || {
      networkUrl: 'https://api.helium.fhenix.zone',
      kmsContractAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', // Fhenix KMS contract
      gatewayUrl: 'https://gateway.fhenix.zone',
    }
  } else {
    throw new Error(`Unsupported chain ID: ${chainIdNumber}. Please use localhost (31337), Sepolia (11155111), or Fhenix Helium (10143)`)
  }

  const config: FhevmConfig = {
    ...baseConfig,
    network: window.ethereum,
  }
  
  console.log('⚙️ FHE Config:', config)

  fhevmInstance = await sdk.createInstance(config)
  console.log('✅ FHE instance created:', fhevmInstance)

  return fhevmInstance!
}

/**
 * Get the current FHE instance
 */
export function getFHEInstance(): FhevmInstance {
  if (!fhevmInstance) {
    throw new Error('FHE not initialized. Call initFHE() first.')
  }
  return fhevmInstance
}

/**
 * Convert string to number for encryption
 * 
 * IMPORTANT: FHE can only encrypt NUMBERS, not raw text!
 * This function converts text to a numeric representation.
 * 
 * OPTIONS:
 * 1. Hash (current): Fast but LOSSY - you can't recover original text
 * 2. UTF-8 bytes: Encode each character, but limited length
 * 3. Store text off-chain (IPFS) and only encrypt the key
 * 
 * Current implementation uses hash for demo purposes.
 * For production, consider storing full text off-chain.
 */
function stringToNumber(str: string): number {
  // Simple hash - LOSSY encoding (cannot decode back to text)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Note: To store the original text securely:
 * - Option 1: Encrypt text client-side (AES), store encrypted text off-chain (IPFS/Arweave)
 * - Option 2: Split text into chunks, encrypt each chunk as euint64 (8 bytes per chunk)
 * - Option 3: Use the hash as verification only, store encrypted text separately
 * 
 * For now, we recommend storing a short numeric message or using off-chain storage.
 */

/**
 * Encrypt string content using euint64
 * Returns encrypted input and proof for the contract
 */
export async function encryptContent(
  content: string,
  userAddress: string
): Promise<{
  encryptedData: Uint8Array
  proof: Uint8Array
}> {
  const instance = getFHEInstance()
  
  // Convert string to number (simple approach - hash the content)
  const numericValue = stringToNumber(content)
  
  // Encrypt as euint64
  const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress)
  input.add64(numericValue)
  
  const encryptedInput = await input.encrypt()
  
  return {
    encryptedData: encryptedInput.handles[0], // The encrypted euint64 handle
    proof: encryptedInput.inputProof, // The proof
  }
}

/**
 * Encrypt AES key (as bigint number) with FHE
 * This is used for hybrid encryption: AES encrypts content, FHE encrypts AES key
 */
export async function encryptAesKey(
  aesKeyNumber: bigint,
  userAddress: `0x${string}`
): Promise<{
  encryptedAesKey: `0x${string}`
  inputProof: `0x${string}`
}> {
  const instance = getFHEInstance()
  
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured')
  }

  console.log('🔒 Encrypting AES key with FHE:', { 
    aesKeyNumber: aesKeyNumber.toString(),
    contractAddress: CONTRACT_ADDRESS,
    userAddress 
  })
  
  // Create encrypted input for the contract with user address
  const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress)
  
  // ✅ 使用 BigInt 避免精度丢失
  // 如果 aesKeyNumber 太大，只取低 64 位
  const safeBigInt = aesKeyNumber & ((1n << 64n) - 1n) // 确保在 64 位范围内
  
  console.log('🔢 Encrypting with bigint (no precision loss):', {
    original: aesKeyNumber.toString(),
    safe64bit: safeBigInt.toString(),
    type: typeof safeBigInt
  })
  
  // add64 接受 bigint 或 number，优先使用 bigint
  input.add64(safeBigInt)
  
  const encrypted = await input.encrypt()
  
  console.log('✅ AES key encryption result:', {
    handles: encrypted.handles,
    proof: encrypted.inputProof
  })
  
  // Return as hex strings
  return {
    encryptedAesKey: bytesToHex(encrypted.handles[0]),
    inputProof: bytesToHex(encrypted.inputProof),
  }
}

/**
 * Encrypt message and get input for contract call (DEPRECATED - use AES hybrid encryption)
 * This version is compatible with the OLD TimeCapsule contract's createCapsule function
 * @deprecated Use encryptAesKey + AES encryption instead
 */
export async function encryptMessage(
  message: string,
  userAddress: `0x${string}`
): Promise<{
  encryptedMessage: `0x${string}`
  inputProof: `0x${string}`
}> {
  const instance = getFHEInstance()
  
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured')
  }

  // Convert message to numeric value
  const messageValue = stringToNumber(message)
  
  console.log('⚠️  Using deprecated encryptMessage - consider using AES hybrid encryption')
  console.log('🔒 Encrypting message:', { 
    original: message, 
    numeric: messageValue,
    contractAddress: CONTRACT_ADDRESS,
    userAddress 
  })
  
  // Create encrypted input for the contract with user address
  const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress)
  input.add64(messageValue)
  
  const encrypted = await input.encrypt()
  
  console.log('✅ Encryption result:', {
    handles: encrypted.handles,
    proof: encrypted.inputProof
  })
  
  // Return as hex strings
  return {
    encryptedMessage: bytesToHex(encrypted.handles[0]),
    inputProof: bytesToHex(encrypted.inputProof),
  }
}

/**
 * Decrypt content (note: actual decryption happens on-chain)
 * This is a placeholder for client-side decryption after reencryption
 */
export async function decryptContent(encryptedBytes: Uint8Array): Promise<string> {
  // In FHE, decryption typically happens on-chain
  // This would be used after getting reencrypted data from the contract
  const decoder = new TextDecoder()
  const content = decoder.decode(encryptedBytes)
  
  return content
}

/**
 * Decrypt euint64 value from contract using EIP-712 signature
 * @param contractAddress - The contract address
 * @param encryptedHandle - The encrypted handle (euint64) returned from contract
 * @param userAddress - The user's address
 * @param signer - The ethers signer for EIP-712 signature
 * @returns The decrypted number value
 */
export async function decryptEuint64(
  contractAddress: `0x${string}`,
  encryptedHandle: bigint,
  userAddress: `0x${string}`,
  signer: any // ethers Signer
): Promise<bigint> {
  // Convert bigint handle to 32-byte hex string (without 0x prefix)
  const handleHex = encryptedHandle.toString(16).padStart(64, '0')
  
  console.log('🔐 Decrypting euint64:', {
    contractAddress,
    handleBigInt: encryptedHandle.toString(),
    handleHex,
    userAddress
  })
  
  try {
    const instance = getFHEInstance()
    // Step 1: Generate keypair for decryption
    const keypair = instance.generateKeypair()
    console.log('✅ Generated keypair')
    
    // Step 2: Prepare handle-contract pairs
    const handleContractPairs = [
      {
        handle: handleHex,
        contractAddress: contractAddress,
      },
    ]
    
    // Step 3: Create EIP-712 signature parameters
    const startTimeStamp = Math.floor(Date.now() / 1000).toString()
    const durationDays = '10' // Signature valid for 10 days
    const contractAddresses = [contractAddress]
    
    // Step 4: Create EIP-712 typed data
    const eip712 = instance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays,
    )
    
    console.log('🔏 Signing EIP-712 message...')
    
    // Step 5: Sign with user's wallet (viem format)
    const signature = await signer.signTypedData({
      domain: eip712.domain,
      types: {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      primaryType: 'UserDecryptRequestVerification',
      message: eip712.message,
    })
    
    console.log('✅ EIP-712 signature obtained')
    
    // Step 6: User decrypt with signature
    console.log('📡 Calling KMS Gateway for decryption...', {
      handleContractPairs,
      contractAddresses,
      userAddress,
      startTimeStamp,
      durationDays
    })
    
    const result = await instance.userDecrypt(
      handleContractPairs.map(pair => ({ handle: pair.handle, contractAddress: pair.contractAddress })),
      keypair.privateKey,    // privateKey
      keypair.publicKey,     // publicKey
      signature.replace('0x', ''),  // signature (without 0x prefix)
      contractAddresses,     // contractAddresses
      userAddress,           // userAddress
      startTimeStamp,        // startTimestamp
      durationDays          // durationDays
    )
    
    console.log('📡 KMS Gateway response received:', result)
    
    // Step 7: Extract decrypted value
    // userDecrypt returns keys with '0x' prefix
    const resultKey = '0x' + handleHex
    const decryptedValue = (result as any)[resultKey]
    
    if (decryptedValue === undefined) {
      throw new Error(`Decryption failed: handle not found in result. Available keys: ${Object.keys(result).join(', ')}`)
    }
    
    console.log('✅ Decryption successful:', decryptedValue)
    return BigInt(decryptedValue)
  } catch (error) {
    console.error('❌ Decryption failed:', error)
    throw error
  }
}

/**
 * Encrypt file content
 */
export async function encryptFile(
  file: File,
  userAddress: string
): Promise<{
  encryptedData: Uint8Array
  proof: Uint8Array
}> {
  const instance = getFHEInstance()
  
  // const arrayBuffer = await file.arrayBuffer() // 暂时注释掉，后续可能需要
  // const bytes = new Uint8Array(arrayBuffer) // 暂时注释掉，后续可能需要
  
  // For files, we'll encrypt a hash/checksum as a number
  const fileHash = stringToNumber(file.name + file.size)
  
  const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress)
  input.add64(fileHash)
  
  const encryptedInput = await input.encrypt()
  
  return {
    encryptedData: encryptedInput.handles[0],
    proof: encryptedInput.inputProof,
  }
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const hexString = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(hexString.length / 2)
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16)
  }
  
  return bytes
}

