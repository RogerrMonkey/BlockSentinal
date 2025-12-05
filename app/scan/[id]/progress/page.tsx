'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { ScanResponse, ScanStatus } from '@/lib/types'
import { CheckCircle, Circle, Loader2, AlertCircle, Shield, Zap, Brain, FileText } from 'lucide-react'

interface ScanStage {
  id: string
  name: string
  description: string
  icon: any
  progressRange: [number, number] // [start%, end%]
}

export default function ScanProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [scan, setScan] = useState<ScanResponse | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)

  const stages: ScanStage[] = [
    {
      id: 'init',
      name: 'Initializing Scan',
      description: 'Preparing analysis environment and fetching contract source code',
      icon: Circle,
      progressRange: [0, 10]
    },
    {
      id: 'slither',
      name: 'Static Analysis',
      description: 'Running Slither to detect vulnerabilities and code patterns',
      icon: Shield,
      progressRange: [10, 40]
    },
    {
      id: 'mythril',
      name: 'Symbolic Execution',
      description: 'Analyzing contract logic with Mythril for security flaws',
      icon: Zap,
      progressRange: [40, 70]
    },
    {
      id: 'ai',
      name: 'AI-Powered Analysis',
      description: 'Deep learning analysis using local Llama model',
      icon: Brain,
      progressRange: [70, 90]
    },
    {
      id: 'report',
      name: 'Generating Report',
      description: 'Compiling findings and creating comprehensive security report',
      icon: FileText,
      progressRange: [90, 100]
    }
  ]

  // Calculate progress based on actual stage from backend
  const calculateProgress = (status: ScanStatus, currentStage?: string) => {
    if (status === ScanStatus.PENDING) {
      return 5
    } else if (status === ScanStatus.RUNNING) {
      // Map backend stages to progress ranges
      const stageProgressMap: Record<string, number> = {
        'init': 10,
        'slither': 25,  // Mid-point of slither range (10-40)
        'mythril': 55,  // Mid-point of mythril range (40-70)
        'ai': 80,       // Mid-point of ai range (70-90)
        'report': 95    // Mid-point of report range (90-100)
      }
      return stageProgressMap[currentStage || 'init'] || 10
    } else if (status === ScanStatus.COMPLETED) {
      return 100
    }
    return 0
  }

  // Timer for elapsed time display
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchScan = async () => {
      try {
        await apiClient.pollScanStatus(
          id,
          (updatedScan) => {
            setScan(updatedScan)
            
            // Calculate progress based on actual backend stage
            const newProgress = calculateProgress(updatedScan.status, updatedScan.current_stage)
            setProgress(newProgress)
            
            // Determine current stage based on backend stage
            const stageMap: Record<string, number> = {
              'init': 0,
              'slither': 1,
              'mythril': 2,
              'ai': 3,
              'report': 4
            }
            
            const stageIndex = stageMap[updatedScan.current_stage || 'init'] || 0
            setCurrentStageIndex(stageIndex)
            
            // Calculate stage-specific progress
            const [start, end] = stages[stageIndex].progressRange
            const stagePercent = ((newProgress - start) / (end - start)) * 100
            setStageProgress(Math.max(0, Math.min(100, stagePercent)))
            
            if (updatedScan.status === ScanStatus.FAILED) {
              setError(updatedScan.error_message || 'Scan failed')
            }
          },
          2000, // Poll every 2 seconds
          60 // Max 2 minutes
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch scan status')
      } finally {
        setIsLoading(false)
      }
    }

    fetchScan()
  }, [id])

  useEffect(() => {
    if (scan?.status === ScanStatus.COMPLETED) {
      setTimeout(() => {
        router.push(`/scan/${id}/results`)
      }, 1500)
    }
  }, [scan?.status, id, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)] py-16 px-4">
          <Card className="bg-slate-900 border-red-800 p-8 max-w-lg w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-400">Scan Failed</h2>
                <p className="text-slate-400 text-sm">Analysis encountered an error</p>
              </div>
            </div>
            <Card className="bg-slate-800/50 border-slate-700 p-4 mb-6">
              <p className="text-slate-300 text-sm">{error}</p>
            </Card>
            <div className="flex gap-3">
              <Link href="/scan/new" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Try Again
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full border-slate-600 hover:bg-slate-800">
                  Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  if (isLoading || !scan) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)] py-16 px-4">
          <Card className="bg-slate-900 border-slate-800 p-8 text-center max-w-md w-full">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400">Initializing scan...</p>
          </Card>
        </main>
      </div>
    )
  }

  const currentStage = stages[currentStageIndex]

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="py-8 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Security Analysis in Progress
            </h1>
            <p className="text-slate-400">
              Running multi-layer vulnerability detection
            </p>
          </div>

          {/* Main Progress Card */}
          <Card className="bg-slate-900 border-slate-800 p-6 md:p-8 mb-6">
            {/* Circular Progress */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                    className="text-blue-600 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{Math.round(progress)}%</span>
                  <span className="text-xs text-slate-400">{formatTime(elapsedTime)}</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                  {progress < 100 ? (
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                  <h2 className="text-2xl font-bold text-white">{currentStage.name}</h2>
                </div>
                <p className="text-slate-400 mb-4">{currentStage.description}</p>
                
                {/* Stage Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stageProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">
                  Stage {currentStageIndex + 1} of {stages.length} • {Math.round(stageProgress)}% complete
                </p>
              </div>
            </div>

            {/* Contract Info */}
            <Card className="bg-slate-800/50 border-slate-700 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Contract</p>
                  <p className="text-slate-300 font-mono">
                    {scan.contract_address 
                      ? `${scan.contract_address.slice(0, 10)}...${scan.contract_address.slice(-8)}`
                      : 'Uploaded Source'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Network</p>
                  <p className="text-slate-300 capitalize">{scan.network || 'Mainnet'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Scan ID</p>
                  <p className="text-slate-300 font-mono">{id.slice(0, 8)}</p>
                </div>
              </div>
            </Card>

            {/* Overall Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-center text-slate-400 text-sm">
              Overall Progress: {Math.round(progress)}%
            </p>
          </Card>

          {/* Stages List */}
          <Card className="bg-slate-900 border-slate-800 p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6">Analysis Pipeline</h3>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const [stageStart, stageEnd] = stage.progressRange
                const isCompleted = progress >= stageEnd
                const isCurrent = index === currentStageIndex
                const isPending = progress < stageStart

                return (
                  <div 
                    key={stage.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                      isCurrent 
                        ? 'bg-blue-900/20 border-2 border-blue-600' 
                        : isCompleted 
                        ? 'bg-green-900/10 border border-green-800' 
                        : 'bg-slate-800/30 border border-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-green-600' 
                        : isCurrent 
                        ? 'bg-blue-600' 
                        : 'bg-slate-700'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <stage.icon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${
                          isCompleted 
                            ? 'text-green-400' 
                            : isCurrent 
                            ? 'text-blue-400' 
                            : 'text-slate-400'
                        }`}>
                          {stage.name}
                        </h4>
                        <span className={`text-xs font-mono ${
                          isCompleted 
                            ? 'text-green-400' 
                            : isCurrent 
                            ? 'text-blue-400' 
                            : 'text-slate-500'
                        }`}>
                          {isCompleted ? '✓ Complete' : isCurrent ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{stage.description}</p>
                      
                      {isCurrent && (
                        <div className="mt-3">
                          <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${stageProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Actions */}
          <div className="mt-6 text-center">
            {progress >= 100 ? (
              <Link href={`/scan/${id}/results`}>
                <Button className="bg-green-600 hover:bg-green-700 px-8">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  View Results
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-400 hover:text-white"
                onClick={() => router.push('/dashboard')}
              >
                Return to Dashboard
              </Button>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}