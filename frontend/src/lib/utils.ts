import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getTimeRemaining(unlockTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = unlockTime - now
  
  if (diff <= 0) return 'Ready to unlock'
  
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function validateUnlockTime(unlockTime: Date): { valid: boolean; error?: string } {
  const now = new Date()
  const minTime = new Date(now.getTime() + 60 * 1000) // 1 minute from now
  const maxTime = new Date(now.getTime() + 3 * 365 * 24 * 60 * 60 * 1000) // 3 years from now
  
  if (unlockTime < minTime) {
    return { valid: false, error: 'Unlock time must be at least 1 minute from now' }
  }
  
  if (unlockTime > maxTime) {
    return { valid: false, error: 'Unlock time cannot exceed 3 years' }
  }
  
  return { valid: true }
}





