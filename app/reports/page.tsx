'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { Eye } from 'lucide-react'
import { apiClient } from '@/lib/api'
import type { ScanListItem } from '@/lib/types'
import Link from 'next/link'
import { useActiveAccount } from 'thirdweb/react'

export default function ReportsPage() {
  const account = useActiveAccount()
  const address = account?.address
  const [scans, setScans] = useState<ScanListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScans() {
      try {
        const data = await apiClient.listScans()
        setScans(data.scans)
      } catch (error) {
        console.error('Failed to fetch scans:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (address) {
      fetchScans()
    }
  }, [address])

  if (!address) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Please connect your wallet to view reports</p>
            <p className="text-slate-500 text-sm">Click the "Connect Wallet" button in the top right corner</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Scan Reports</h1>
            <p className="text-slate-400">View and manage all your security scan reports</p>
          </div>

            {/* Reports Grid */}
            {loading ? (
              <Card className="bg-slate-900 p-12 text-center">
                <p className="text-slate-400">Loading reports...</p>
              </Card>
            ) : scans.length === 0 ? (
              <Card className="bg-slate-900 p-12 text-center">
                <p className="text-slate-400 mb-4">No reports yet</p>
                <Link href="/scan/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">Start Your First Scan</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scans.filter(scan => scan.status === 'completed').map(scan => {
                  const address = scan.contract_address || 'Code Upload'
                  const displayAddr = address.length > 42 ? address.slice(0, 6) + '...' + address.slice(-4) : address
                  const findingsText = scan.findings_count === 1 ? '1 finding' : `${scan.findings_count} findings`
                  
                  return (
                    <Card key={scan.scan_id} className="bg-slate-900 p-6 hover:bg-slate-800 transition">
                      <div className="mb-4">
                        <p className="text-slate-400 text-sm mb-2">Contract</p>
                        <p className="text-white font-mono font-semibold text-sm">{displayAddr}</p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-slate-400 text-sm mb-2">Scan Date</p>
                        <p className="text-white text-sm">{new Date(scan.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-slate-400 text-sm mb-2">Findings</p>
                        <p className="text-white text-sm">{findingsText}</p>
                      </div>

                      <div className="pt-4">
                        <Link href={`/scan/${scan.scan_id}/results`} className="block">
                          <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white">
                            <Eye className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </main>
    </div>
  )
}
