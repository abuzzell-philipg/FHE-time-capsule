/**
 * FHEVM Type Definitions
 * Type definitions for FHEVM SDK integration
 */

export interface FhevmInstance {
  // 加密方法 (来自 Zama SDK)
  encrypt8(value: number): Promise<Uint8Array>;
  encrypt16(value: number): Promise<Uint8Array>;
  encrypt32(value: number): Promise<Uint8Array>;
  encrypt64(value: bigint): Promise<Uint8Array>;
  encryptAddress(address: string): Promise<Uint8Array>;
  encryptBool(value: boolean): Promise<Uint8Array>;
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  getPublicKey(contractAddress: string): Promise<string>;
  reencrypt(
    handle: bigint,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddress: string,
    userAddress: string
  ): Promise<bigint>;
  
  // 用户解密方法 (自定义扩展)
  generateKeypair: () => {
    publicKey: string
    privateKey: string
  }
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimeStamp: string,
    durationDays: string
  ) => {
    domain: any
    types: any
    message: any
  }
  userDecrypt: (
    handleContractPairs: Array<{
      handle: string
      contractAddress: string
    }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimeStamp: string,
    durationDays: string
  ) => Promise<{
    success: boolean
    data?: string
    error?: string
  }>
}

// EncryptedInput 接口
export interface EncryptedInput {
  add8(value: number): EncryptedInput;
  add16(value: number): EncryptedInput;
  add32(value: number): EncryptedInput;
  add64(value: bigint | number): EncryptedInput;
  addAddress(address: string): EncryptedInput;
  addBool(value: boolean): EncryptedInput;
  encrypt(): Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }>;
}

export interface FHEContextValue {
  instance: FhevmInstance | null
  isInitialized: boolean
  isInitializing: boolean
  error: Error | null
  initialize: () => Promise<void>
}

export interface DecryptResult {
  success: boolean
  data?: string
  error?: string
}

export interface FhevmConfig {
  networkUrl: string
  kmsContractAddress: string
  gatewayUrl: string
  network: any
}
