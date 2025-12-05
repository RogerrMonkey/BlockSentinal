'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'

export function QuickScan() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('upload')
  const [fileName, setFileName] = useState('')
  const [address, setAddress] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      setSourceCode(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      let scanData
      if (activeTab === 'upload') {
        if (!sourceCode) {
          setError('Please upload a contract file')
          return
        }
        scanData = {
          source_type: 'upload' as const,
          source_code: sourceCode,
        }
      } else {
        if (!address || !address.startsWith('0x')) {
          setError('Please enter a valid contract address')
          return
        }
        scanData = {
          source_type: 'address' as const,
          contract_address: address,
        }
      }

      const response = await apiClient.createScan(scanData)
      router.push(`/scan/${response.scan_id}/progress`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-slate-900 p-8 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">Quick Scan</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded transition ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('address')}
          className={`px-4 py-2 rounded transition ${
            activeTab === 'address'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400'
          }`}
        >
          Enter Address
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-4">
          <label className="rounded p-8 text-center bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer block">
            <input
              type="file"
              accept=".sol"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-300 mb-1">
              {fileName || 'Drop .sol file here or click to browse'}
            </p>
            <p className="text-slate-500 text-sm">Supports files up to 10MB</p>
          </label>
          <Button
            onClick={handleSubmit}
            disabled={!sourceCode || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Starting Scan...
              </>
            ) : (
              <>
                Start Scan
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="0x..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-800 rounded px-4 py-2 text-white placeholder-slate-500"
          />
          <Button
            onClick={handleSubmit}
            disabled={!address || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Starting Scan...
              </>
            ) : (
              <>
                Scan Contract
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}