/**
 * AES-256-GCM Encryption Utilities for Client-Side Encryption
 * 
 * This module provides hybrid encryption:
 * 1. Generate random AES-256 key
 * 2. Encrypt message with AES-GCM
 * 3. Convert AES key to number for FHE encryption
 * 4. Store encrypted message on-chain, FHE-encrypted key on-chain
 */

/**
 * Generate a random AES-256 key (32 bytes = 256 bits)
 * But we only use first 8 bytes (64 bits) to fit into euint64
 */
export async function generateAesKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // 256-bit key
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Convert AES key to a 64-bit number for FHE encryption
 * We take the first 8 bytes of the key
 * ✅ 严格按照测试脚本 (testTimeCapsule.ts line 125-128)
 * 使用大端序 (Big-Endian)
 */
export async function aesKeyToNumber(key: CryptoKey): Promise<bigint> {
  const rawKey = await crypto.subtle.exportKey('raw', key)
  const keyBytes = new Uint8Array(rawKey)
  
  // 严格按照测试脚本的加密逻辑:
  // let aesKeyNumber = 0n;
  // for (let i = 0; i < 8; i++) {
  //   aesKeyNumber = (aesKeyNumber << 8n) | BigInt(aesKeyFirst8Bytes[i]);
  // }
  let num = 0n
  for (let i = 0; i < 8; i++) {
    num = (num << 8n) | BigInt(keyBytes[i])
  }
  
  console.log('🔑 AES Key to Number (Big-Endian):', {
    bytes: Array.from(keyBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '),
    number: num.toString(),
    hex: '0x' + num.toString(16).padStart(16, '0')
  })
  
  return num
}

/**
 * Convert a 64-bit number back to AES key
 * We reconstruct the first 8 bytes, pad with zeros for remaining 24 bytes
 * ✅ 使用大端序 (Big-Endian) 与测试脚本保持一致
 */
export async function numberToAesKey(numInput: bigint): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(32) // 256-bit = 32 bytes
  
  // ✅ 大端序：从高位到低位 (与测试脚本一致)
  // 测试脚本: for (let i = 7; i >= 0; i--) { decodedAesKeyFirst8Bytes[i] = Number(num & 0xFFn); num = num >> 8n; }
  let num = numInput
  for (let i = 7; i >= 0; i--) {
    keyBytes[i] = Number(num & 0xFFn)
    num = num >> 8n
  }
  
  console.log('🔑 Number to AES Key (Big-Endian):', {
    number: numInput.toString(),
    hex: '0x' + numInput.toString(16).padStart(16, '0'),
    bytes: Array.from(keyBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')
  })
  
  // Remaining 24 bytes are zeros (padding)
  // This is a simplified approach - for production use full 256-bit key storage
  
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt text with AES-GCM
 * Returns base64-encoded ciphertext
 * Format: IV (12 bytes) + ciphertext + authTag (16 bytes)
 */
export async function encryptWithAes(
  text: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Encrypt with AES-GCM
  // Note: Web Crypto API automatically appends the 16-byte auth tag to ciphertext
  const encryptedWithTag = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 128 bits = 16 bytes auth tag
    },
    key,
    data
  )
  
  // Combine IV + (ciphertext + authTag)
  // encryptedWithTag already contains ciphertext + authTag
  const combined = new Uint8Array(iv.length + encryptedWithTag.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedWithTag), iv.length)
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt AES-GCM encrypted text
 * Input: base64-encoded ciphertext (IV + encrypted data + authTag)
 * Format: IV (12 bytes) + ciphertext + authTag (16 bytes)
 * ✅ 严格按照测试脚本 (testTimeCapsule.ts line 310-326)
 */
export async function decryptWithAes(
  encryptedBase64: string,
  key: CryptoKey
): Promise<string> {
  console.log('🔓 decryptWithAes called')
  
  // Export key for debugging
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  const keyBytes = new Uint8Array(exportedKey)
  console.log('🔑 AES Key bytes:', {
    first8: Array.from(keyBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '),
    full: Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join(' ')
  })
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
  console.log('📦 Encrypted data:', {
    totalLength: combined.length,
    ivLength: 12,
    ciphertextWithTagLength: combined.length - 12,
    fullHex: Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join(' ')
  })
  
  // Extract IV (first 12 bytes) and ciphertext+authTag (rest)
  const iv = combined.slice(0, 12)
  const ciphertextWithTag = combined.slice(12)
  
  console.log('🔢 Decryption components:', {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(' '),
    ciphertextWithTagLength: ciphertextWithTag.length,
    ciphertextWithTag: Array.from(ciphertextWithTag).map(b => b.toString(16).padStart(2, '0')).join(' ')
  })
  
  // Web Crypto API expects ciphertext with auth tag appended
  // The tag is the last 16 bytes, but we pass it all together
  
  try {
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // 128 bits = 16 bytes auth tag
      },
      key,
      ciphertextWithTag
    )
    
    // Convert back to string
    const decoder = new TextDecoder()
    const result = decoder.decode(decrypted)
    console.log('✅ Decryption successful!')
    return result
  } catch (error) {
    console.error('❌ Decryption failed:', error)
    throw error
  }
}

/**
 * Complete encryption flow for time capsule
 * 1. Generate AES key
 * 2. Convert to number (extracts first 8 bytes)
 * 3. Reconstruct key from number (8 bytes + 24 zero bytes)
 * 4. Encrypt message with reconstructed key
 * 
 * ⚠️ CRITICAL: Encryption and decryption MUST use the same key structure!
 * Since we only store 8 bytes via FHE, we must encrypt with the same
 * "8 bytes + 24 zeros" structure that we'll use for decryption.
 */
export async function encryptMessage(
  message: string
): Promise<{
  encryptedContent: string // Base64 AES-encrypted message
  aesKeyNumber: bigint     // AES key as number (for FHE encryption)
  aesKey: CryptoKey        // Reconstructed AES key (for testing/debugging)
}> {
  console.log('🔐 Starting AES encryption...')
  console.log('📝 Message:', message)
  
  // Generate temporary AES key
  const tempAesKey = await generateAesKey()
  console.log('🔑 Temporary AES key generated')
  
  // Convert key to number for FHE (extracts first 8 bytes)
  const aesKeyNumber = await aesKeyToNumber(tempAesKey)
  console.log('🔢 AES key as number:', aesKeyNumber.toString())
  
  // ✅ Reconstruct key from number (8 bytes + 24 zeros)
  // This ensures encryption and decryption use the SAME key structure
  const aesKey = await numberToAesKey(aesKeyNumber)
  console.log('🔑 AES key reconstructed for encryption (8 bytes + 24 zeros)')
  
  // Encrypt message with reconstructed key
  const encryptedContent = await encryptWithAes(message, aesKey)
  console.log('✅ Message encrypted with AES')
  
  return {
    encryptedContent,
    aesKeyNumber,
    aesKey, // Return reconstructed key for debugging
  }
}

/**
 * Complete decryption flow for time capsule
 * 1. Convert FHE-decrypted number back to AES key
 * 2. Decrypt message with AES key
 */
export async function decryptMessage(
  encryptedContent: string,
  aesKeyNumber: bigint | string | number
): Promise<string> {
  console.log('🔓 Starting AES decryption...')
  
  // ✅ 确保转换为 BigInt，避免精度丢失
  const aesKeyBigInt = typeof aesKeyNumber === 'bigint' 
    ? aesKeyNumber 
    : BigInt(aesKeyNumber.toString())
  
  console.log('🔢 AES key number:', aesKeyBigInt.toString())
  
  // Reconstruct AES key from number
  const aesKey = await numberToAesKey(aesKeyBigInt)
  console.log('🔑 AES key reconstructed')
  
  // Decrypt message
  const decryptedMessage = await decryptWithAes(encryptedContent, aesKey)
  console.log('✅ Message decrypted:', decryptedMessage)
  
  return decryptedMessage
}

/**
 * Utility: Test encryption/decryption round-trip
 */
export async function testAesEncryption(message: string): Promise<boolean> {
  try {
    console.log('\n🧪 Testing AES encryption round-trip...')
    
    const { encryptedContent, aesKeyNumber } = await encryptMessage(message)
    const decrypted = await decryptMessage(encryptedContent, aesKeyNumber)
    
    const success = decrypted === message
    console.log(success ? '✅ Test passed!' : '❌ Test failed!')
    console.log('Original:', message)
    console.log('Decrypted:', decrypted)
    
    return success
  } catch (error) {
    console.error('❌ Test error:', error)
    return false
  }
}

