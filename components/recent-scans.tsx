'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { ScanListItem, ScanStatus } from '@/lib/types'

export function RecentScans() {
  const [scans, setScans] = useState<ScanListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const data = await apiClient.listScans({ limit: 10 })
        setScans(data.scans)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scans')
      } finally {
        setIsLoading(false)
      }
    }

    fetchScans()
  }, [])

  const handleDelete = async (scanId: string, contractAddress: string) => {
    // Custom confirmation dialog with detailed warning
    const confirmed = window.confirm(
      `⚠️ DELETE SCAN PERMANENTLY?\n\n` +
      `Contract: ${contractAddress}\n\n` +
      `This will permanently delete:\n` +
      `• Scan record\n` +
      `• All vulnerability findings\n` +
      `• Generated reports\n` +
      `• Storage files\n\n` +
      `❌ This action CANNOT be undone!\n\n` +
      `Type 'DELETE' in the prompt to confirm.`
    )

    if (!confirmed) return

    // Additional confirmation step
    const confirmText = window.prompt(
      'To confirm deletion, type DELETE (all caps):'
    )

    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled. Text did not match.')
      return
    }

    try {
      await apiClient.deleteScan(scanId)
      setScans(scans.filter(s => s.scan_id !== scanId))
      alert('✓ Scan deleted successfully')
    } catch (err) {
      alert('Failed to delete scan: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const getStatusBadge = (status: ScanStatus) => {
    switch(status) {
      case ScanStatus.COMPLETED: return 'bg-green-600/20 text-green-400'
      case ScanStatus.RUNNING: return 'bg-blue-600/20 text-blue-400'
      case ScanStatus.PENDING: return 'bg-yellow-600/20 text-yellow-400'
      case ScanStatus.FAILED: return 'bg-red-600/20 text-red-400'
      default: return 'bg-slate-600/20 text-slate-400'
    }
  }

  return (
    <Card className="bg-slate-900 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Recent Scans</h3>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-400">Loading scans...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-400 mb-4">No scans yet</p>
          <Link href="/scan/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Start Your First Scan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold text-sm">Contract</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold text-sm">Findings</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold text-sm">Date</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.scan_id} className="hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 text-white font-mono text-sm">
                    {scan.contract_address 
                      ? `${scan.contract_address.slice(0, 6)}...${scan.contract_address.slice(-4)}`
                      : 'Upload'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(scan.status)}`}>
                      {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{scan.findings_count}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {scan.status === ScanStatus.COMPLETED ? (
                      <Link href={`/scan/${scan.scan_id}/results`}>
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : scan.status === ScanStatus.RUNNING || scan.status === ScanStatus.PENDING ? (
                      <Link href={`/scan/${scan.scan_id}/progress`}>
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-400 hover:text-white">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="border-slate-600 text-slate-400" disabled>
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-slate-600 text-slate-400 hover:text-red-400"
                      onClick={() => handleDelete(scan.scan_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}