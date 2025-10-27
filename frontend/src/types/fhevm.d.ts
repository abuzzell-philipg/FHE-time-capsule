/**
 * Type declarations for Zama FHE SDK (UMD version)
 * Loaded via CDN script tag
 */

interface FhevmSDK {
  initSDK: () => Promise<void>;
  createInstance: (config: FhevmConfig) => Promise<FhevmInstance>;
  SepoliaConfig: FhevmConfig;
}

declare global {
  interface Window {
    // Support multiple possible global variable names
    fhevm?: FhevmSDK;
    zamaRelayerSDK?: FhevmSDK;
    relayerSDK?: FhevmSDK;
    ZamaRelayerSDK?: FhevmSDK;
    RelayerSDK?: FhevmSDK;
  }
}

export interface FhevmConfig {
  network: any; // window.ethereum or provider
  gatewayUrl?: string;
  coprocessorUrl?: string;
  kmsContractAddress?: string;
  aclContractAddress?: string;
}

export interface FhevmInstance {
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
}

export interface EncryptedInput {
  add8(value: number): EncryptedInput;
  add16(value: number): EncryptedInput;
  add32(value: number): EncryptedInput;
  add64(value: bigint | number): EncryptedInput;
  addAddress(address: string): EncryptedInput;
  addBool(value: boolean): EncryptedInput;
  encrypt(): Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }>;
}

export {};

