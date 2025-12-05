'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Upload, ArrowRight, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useActiveAccount } from 'thirdweb/react'
import { useScanLimits } from '@/lib/useScanLimits'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'

export default function NewScanPage() {
  const account = useActiveAccount()
  const address = account?.address
  const router = useRouter()
  const { canScan, remainingFreeScans, isAuthenticated, incrementScanCount } = useScanLimits()
  
  const [activeTab, setActiveTab] = useState('upload')
  const [sourceCode, setSourceCode] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [network, setNetwork] = useState<'mainnet' | 'sepolia'>('mainnet')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [fileValidationError, setFileValidationError] = useState('')

  // Validate Solidity code syntax
  const validateSolidityCode = (code: string): { valid: boolean; error?: string } => {
    if (!code.trim()) {
      return { valid: false, error: 'Code cannot be empty' }
    }

    // Check for Solidity pragma
    const pragmaRegex = /pragma\s+solidity\s+[\^><=~]?\s*\d+\.\d+\.\d+;/
    if (!pragmaRegex.test(code)) {
      return { valid: false, error: 'Invalid Solidity code: Missing or invalid pragma statement (e.g., pragma solidity ^0.8.0;)' }
    }

    // Check for contract, library, or interface declaration
    const contractRegex = /(contract|library|interface)\s+\w+/
    if (!contractRegex.test(code)) {
      return { valid: false, error: 'Invalid Solidity code: No contract, library, or interface declaration found' }
    }

    // Check for common non-Solidity patterns
    const invalidPatterns = [
      { regex: /import\s+(?:React|react)/i, message: 'JavaScript/TypeScript code detected. Only Solidity (.sol) files are supported' },
      { regex: /(def\s+\w+\(|import\s+\w+|from\s+\w+\s+import)/i, message: 'Python code detected. Only Solidity (.sol) files are supported' },
      { regex: /(public\s+class|public\s+static\s+void\s+main)/i, message: 'Java code detected. Only Solidity (.sol) files are supported' },
      { regex: /(#include|using\s+namespace|std::)/i, message: 'C/C++ code detected. Only Solidity (.sol) files are supported' },
      { regex: /(package\s+main|func\s+main\()/i, message: 'Go code detected. Only Solidity (.sol) files are supported' },
      { regex: /<!DOCTYPE\s+html>/i, message: 'HTML code detected. Only Solidity (.sol) files are supported' },
    ]

    for (const pattern of invalidPatterns) {
      if (pattern.regex.test(code)) {
        return { valid: false, error: pattern.message }
      }
    }

    // Check minimum code length (prevent trivial submissions)
    if (code.length < 50) {
      return { valid: false, error: 'Code is too short. Please provide a complete Solidity contract' }
    }

    // Check maximum file size (prevent DoS)
    const maxSize = 1024 * 1024 // 1MB
    if (code.length > maxSize) {
      return { valid: false, error: 'Code is too large. Maximum size is 1MB' }
    }

    return { valid: true }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileValidationError('')
    setError('')
    
    if (!file) return

    // Strict file extension check
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.sol')) {
      setFileValidationError(`Invalid file type: "${file.name}". Only .sol (Solidity) files are accepted.`)
      e.target.value = '' // Clear the input
      return
    }

    // Check file size before reading
    const maxSize = 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      setFileValidationError(`File is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 1MB.`)
      e.target.value = ''
      return
    }

    if (file.size === 0) {
      setFileValidationError('File is empty. Please upload a valid Solidity file.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    
    reader.onerror = () => {
      setFileValidationError('Failed to read file. Please try again.')
      e.target.value = ''
    }
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      
      // Validate the content is Solidity code
      const validation = validateSolidityCode(content)
      if (!validation.valid) {
        setFileValidationError(validation.error || 'Invalid Solidity code')
        setSourceCode('') // Clear any existing code
        return
      }
      
      setSourceCode(content)
      setFileValidationError('')
    }
    
    reader.readAsText(file)
  }

  const handleCodePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value
    setSourceCode(code)
    setFileValidationError('')
    
    // Only validate if there's substantial content
    if (code.length > 20) {
      const validation = validateSolidityCode(code)
      if (!validation.valid) {
        setFileValidationError(validation.error || 'Invalid Solidity code')
      }
    }
  }

  const handleScan = async () => {
    if (!canScan) {
      setError('You have reached your free scan limit. Please connect your wallet for unlimited scans.')
      return
    }

    setError('')
    setFileValidationError('')
    setIsScanning(true)

    try {
      let scanData
      if (activeTab === 'upload') {
        if (!sourceCode.trim()) {
          setError('Please upload a contract or paste source code')
          setIsScanning(false)
          return
        }
        
        // Final validation before submission
        const validation = validateSolidityCode(sourceCode)
        if (!validation.valid) {
          setError(validation.error || 'Invalid Solidity code')
          setIsScanning(false)
          return
        }
        
        scanData = await apiClient.createScan({
          source_type: 'upload',
          source_code: sourceCode,
          network: network,
        })
      } else {
        if (!contractAddress.trim()) {
          setError('Please enter a contract address')
          setIsScanning(false)
          return
        }
        
        // Validate Ethereum address format
        const addressRegex = /^0x[a-fA-F0-9]{40}$/
        if (!addressRegex.test(contractAddress)) {
          setError('Invalid Ethereum address format. Must be 42 characters starting with 0x')
          setIsScanning(false)
          return
        }
        
        scanData = await apiClient.createScan({
          source_type: 'address',
          contract_address: contractAddress,
          network: network,
        })
      }

      // Increment scan count
      incrementScanCount()

      // Redirect to progress page
      router.push(`/scan/${scanData.scan_id}/progress`)
    } catch (err: any) {
      setError(err.message || 'Failed to create scan')
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="py-8 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
            {/* Scan Limit Banner */}
            {!isAuthenticated && (
              <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 mb-8">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">Free Scan Available</h3>
                    <p className="text-slate-300 text-sm mb-3">
                      You have <span className="font-bold text-blue-400">{remainingFreeScans}</span> free scan remaining. 
                      Connect your wallet for unlimited scans.
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${remainingFreeScans * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {!canScan && (
              <Card className="bg-red-900/20 border-red-800 p-6 mb-8">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Free Scan Limit Reached</h3>
                    <p className="text-slate-300 text-sm mb-4">
                      You've used your free scan. Connect your MetaMask wallet to continue scanning contracts with unlimited access.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">1</div>
                <p className="text-white">Source Input</p>
              </div>
              <div className="flex-1 h-1 bg-slate-800 mx-4"></div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">2</div>
                <p className="text-slate-400">Scanning</p>
              </div>
              <div className="flex-1 h-1 bg-slate-800 mx-4"></div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">3</div>
                <p className="text-slate-400">Results</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-2 rounded transition ${
                  activeTab === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Contract
              </button>
              <button
                onClick={() => setActiveTab('address')}
                className={`px-6 py-2 rounded transition ${
                  activeTab === 'address' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Scan by Address
              </button>
            </div>

            {/* Network Selector - Only show for address scans */}
            {activeTab === 'address' && (
              <Card className="bg-slate-900 p-6 mb-6">
                <label className="block text-white font-semibold mb-3">
                  Select Network
                </label>
                <div className="flex gap-4">
                  <button
                  onClick={() => setNetwork('mainnet')}
                  className={`flex-1 px-6 py-4 rounded-lg transition ${
                    network === 'mainnet'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300'
                  }`}
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg">Ethereum Mainnet</div>
                      <div className="text-sm opacity-75 mt-1">Production Network</div>
                    </div>
                  </button>
                  <button
                  onClick={() => setNetwork('sepolia')}
                  className={`flex-1 px-6 py-4 rounded-lg transition ${
                    network === 'sepolia'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-lg">Sepolia Testnet</div>
                    <div className="text-sm opacity-75 mt-1">Test Network</div>
                  </div>
                </button>
              </div>
              <p className="text-slate-400 text-sm mt-3">
                {network === 'mainnet' 
                  ? '🔵 Scanning contracts deployed on Ethereum Mainnet' 
                  : '🟣 Scanning contracts deployed on Sepolia Testnet'}
              </p>
            </Card>
            )}

            {/* Content */}
            {activeTab === 'upload' ? (
              <Card className="bg-slate-900 p-8">
                <div className="space-y-6">
                  {/* File Validation Error */}
                  {fileValidationError && (
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-300 font-semibold text-sm mb-1">Validation Error</p>
                          <p className="text-red-200 text-sm">{fileValidationError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-white mb-2">Upload Solidity File (.sol only)</label>
                    <div className="rounded-lg p-8 text-center bg-slate-800/50 hover:bg-slate-800 transition border-2 border-dashed border-slate-700 hover:border-blue-600">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">Drag and drop your .sol file here</p>
                      <p className="text-slate-500 text-sm mb-4">or</p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".sol"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <span className="inline-block px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition">
                          Browse Files
                        </span>
                      </label>
                      <p className="text-slate-500 text-xs mt-4">⚠️ Only Solidity (.sol) files are accepted. Max size: 1MB</p>
                    </div>
                  </div>

                  <div className="text-center text-slate-500">or</div>

                  <div>
                    <label className="block text-white mb-2">Paste Source Code</label>
                    <textarea
                      value={sourceCode}
                      onChange={handleCodePaste}
                      placeholder="pragma solidity ^0.8.0;&#10;&#10;contract MyContract {&#10;    // Your contract code here&#10;}"
                      className="w-full h-64 bg-slate-800 rounded px-4 py-3 text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-slate-500 text-xs mt-2">💡 Paste complete Solidity code including pragma and contract declaration</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-900 p-8">
                <div>
                  <label className="block text-white mb-2">Contract Address</label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-800 rounded px-4 py-3 text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-slate-500 text-sm mt-2">
                    Enter a verified contract address on Ethereum mainnet
                  </p>
                </div>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card className="bg-red-900/20 border-red-800 p-4 mt-6">
                <p className="text-red-300 text-sm">{error}</p>
              </Card>
            )}

            {/* Action Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleScan}
                disabled={isScanning || !canScan}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <>Initiating Scan...</>
                ) : (
                  <>
                    Start Security Scan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
    </div>
  )
}
