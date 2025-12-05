'use client'

import { useActiveAccount } from 'thirdweb/react'
import { useEffect, useState } from 'react'

export interface ScanLimits {
  totalScans: number
  remainingFreeScans: number
  isAuthenticated: boolean
}

export function useScanLimits() {
  const account = useActiveAccount()
  const address = account?.address
  const [limits, setLimits] = useState<ScanLimits>({
    totalScans: 0,
    remainingFreeScans: 1,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Load scan count from localStorage
    const loadScanCount = () => {
      if (typeof window === 'undefined') return

      if (address) {
        // User is authenticated - unlimited scans
        const userScans = localStorage.getItem(`scans_${address}`) || '0'
        setLimits({
          totalScans: parseInt(userScans),
          remainingFreeScans: Infinity,
          isAuthenticated: true,
        })
      } else {
        // Anonymous user - check free scan limit
        const anonScans = localStorage.getItem('anonymous_scans') || '0'
        const count = parseInt(anonScans)
        setLimits({
          totalScans: count,
          remainingFreeScans: Math.max(0, 1 - count),
          isAuthenticated: false,
        })
      }
    }

    loadScanCount()
  }, [address])

  const incrementScanCount = () => {
    if (typeof window === 'undefined') return

    if (address) {
      // Authenticated user
      const current = parseInt(localStorage.getItem(`scans_${address}`) || '0')
      localStorage.setItem(`scans_${address}`, String(current + 1))
      setLimits(prev => ({
        ...prev,
        totalScans: current + 1,
      }))
    } else {
      // Anonymous user
      const current = parseInt(localStorage.getItem('anonymous_scans') || '0')
      const newCount = current + 1
      localStorage.setItem('anonymous_scans', String(newCount))
      setLimits({
        totalScans: newCount,
        remainingFreeScans: Math.max(0, 1 - newCount),
        isAuthenticated: false,
      })
    }
  }

  const canScan = address ? true : limits.remainingFreeScans > 0

  return {
    ...limits,
    canScan,
    incrementScanCount,
  }
}
