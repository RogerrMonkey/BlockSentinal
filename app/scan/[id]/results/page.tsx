'use client'

import { use, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Download, Share2, Copy, ChevronDown, FileText, FileJson, FileSpreadsheet, FileCode } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ReportResponse, Severity } from '@/lib/types'

export default function ScanResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [expandedFinding, setExpandedFinding] = useState(0)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await apiClient.getScanReport(id)
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)] py-16 px-4">
          <Card className="bg-slate-900 border-slate-800 p-8 text-center max-w-md w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading results...</p>
          </Card>
        </main>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)] py-16 px-4">
          <Card className="bg-slate-900 border-slate-800 p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-slate-300 mb-6">{error || 'Report not found'}</p>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full bg-blue-600 hover:bg-blue-700">
              Back to Dashboard
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  const filteredFindings = severityFilter === 'all' 
    ? report.findings 
    : report.findings.filter(f => f.severity === severityFilter)

  const getSeverityColor = (severity: Severity) => {
    switch(severity) {
      case Severity.CRITICAL: return 'bg-red-600 text-white'
      case Severity.HIGH: return 'bg-orange-600 text-white'
      case Severity.MEDIUM: return 'bg-yellow-600 text-white'
      case Severity.LOW: return 'bg-blue-600 text-white'
      default: return 'bg-slate-600 text-white'
    }
  }

  const getAnalyzerBadge = (detectedBy: string) => {
    if (!detectedBy || detectedBy === 'unknown') return null
    
    const isMultiple = detectedBy.toLowerCase().includes('multiple')
    const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    if (isMultiple) {
      return <span className={`${baseClass} bg-purple-900/50 text-purple-300 border border-purple-700`}>🔍 {detectedBy}</span>
    }
    
    if (detectedBy.toLowerCase().includes('slither')) {
      return <span className={`${baseClass} bg-blue-900/50 text-blue-300 border border-blue-700`}>🔧 Slither</span>
    }
    if (detectedBy.toLowerCase().includes('mythril')) {
      return <span className={`${baseClass} bg-amber-900/50 text-amber-300 border border-amber-700`}>⚡ Mythril</span>
    }
    if (detectedBy.toLowerCase().includes('ai') || detectedBy.toLowerCase().includes('gpt')) {
      return <span className={`${baseClass} bg-green-900/50 text-green-300 border border-green-700`}>🤖 AI</span>
    }
    
    return <span className={`${baseClass} bg-slate-700 text-slate-300`}>{detectedBy}</span>
  }

  const getRiskLevel = (summary: typeof report.summary) => {
    if (summary.critical > 0) return { level: 'CRITICAL', color: 'red' }
    if (summary.high > 0) return { level: 'HIGH', color: 'orange' }
    if (summary.medium > 0) return { level: 'MEDIUM', color: 'yellow' }
    if (summary.low > 0) return { level: 'LOW', color: 'blue' }
    return { level: 'SAFE', color: 'green' }
  }

  const risk = getRiskLevel(report.summary)

  const handleDownload = (format: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    window.open(`${API_BASE_URL}/scans/${id}/download/${format}`, '_blank')
    setShowDownloadMenu(false)
  }

  const downloadOptions = [
    { format: 'pdf', label: 'PDF Report', icon: FileText, description: 'Professional formatted report' },
    { format: 'json', label: 'JSON Data', icon: FileJson, description: 'Machine-readable format' },
    { format: 'csv', label: 'CSV Spreadsheet', icon: FileSpreadsheet, description: 'Excel compatible' },
    { format: 'html', label: 'HTML Page', icon: FileCode, description: 'Standalone webpage' },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="py-4 md:py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Scan Results</h1>
                <p className="text-slate-400 text-sm md:text-base">
                  {report.contract_address 
                    ? `${report.contract_address.slice(0, 8)}...${report.contract_address.slice(-6)}`
                    : 'Upload scan'} 
                  {' • '}
                  {report.completed_at 
                    ? new Date(report.completed_at).toLocaleDateString()
                    : 'In progress'}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Download</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                  
                  {showDownloadMenu && (
                    <div className="absolute top-full mt-2 right-0 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                      <div className="p-2">
                        {downloadOptions.map(({ format, label, icon: Icon, description }) => (
                          <button
                            key={format}
                            onClick={() => handleDownload(format)}
                            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors text-left"
                          >
                            <Icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">{label}</div>
                              <div className="text-xs text-slate-400">{description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Risk Score */}
            <Card className="bg-slate-900 border-slate-800 p-8">
              <div className="flex items-center gap-8">
                <div className={`flex items-center justify-center w-32 h-32 rounded-full border-8 border-${risk.color}-600 bg-${risk.color}-600/10`}>
                  <span className={`text-4xl font-bold text-${risk.color}-400`}>{risk.level}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-4">Overall Risk Score: {risk.level}</h2>
                  <p className="text-slate-300 mb-4">
                    {report.summary.total_findings === 0 
                      ? 'This contract passed all security checks.'
                      : 'This contract has detected vulnerabilities that require attention before deployment.'}
                  </p>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-4 rounded">
                      <div className="text-2xl font-bold text-red-400">{report.summary.critical}</div>
                      <div className="text-slate-400 text-sm">Critical</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded">
                      <div className="text-2xl font-bold text-orange-400">{report.summary.high}</div>
                      <div className="text-slate-400 text-sm">High</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded">
                      <div className="text-2xl font-bold text-yellow-400">{report.summary.medium}</div>
                      <div className="text-slate-400 text-sm">Medium</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded">
                      <div className="text-2xl font-bold text-blue-400">{report.summary.low}</div>
                      <div className="text-slate-400 text-sm">Low</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <p className="text-slate-400 mb-3">Filter by severity:</p>
            <div className="flex gap-3">
              {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity)}
                  className={`px-4 py-2 rounded text-sm transition ${
                    severityFilter === severity
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-4">
            {filteredFindings.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800 p-12 text-center">
                <div className="text-6xl mb-4">✓</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {report.summary.total_findings === 0 
                    ? 'No vulnerabilities detected' 
                    : `No ${severityFilter} vulnerabilities found`}
                </h3>
                <p className="text-slate-400">
                  {report.summary.total_findings === 0 
                    ? 'This contract passed all security checks'
                    : 'Try adjusting the severity filter'}
                </p>
              </Card>
            ) : (
              filteredFindings.map((finding, i) => (
                <Card 
                  key={i}
                  className="bg-slate-900 border-slate-800 hover:border-slate-700 transition cursor-pointer"
                  onClick={() => setExpandedFinding(expandedFinding === i ? -1 : i)}
                >
                  <div className="p-6">
                    {/* Finding Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <span className={`px-3 py-1 rounded text-sm font-semibold flex-shrink-0 ${getSeverityColor(finding.severity)}`}>
                          {finding.severity.toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2">{finding.vulnerability_type}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {finding.line_number && (
                              <span className="text-slate-400 text-sm bg-slate-800 px-2 py-1 rounded">Line {finding.line_number}</span>
                            )}
                            {getAnalyzerBadge((finding as any).detected_by || finding.source)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-slate-400 text-xs mb-1">Confidence</p>
                          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400" 
                              style={{ width: `${finding.confidence * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-blue-400 text-xs font-semibold mt-1">{Math.round(finding.confidence * 100)}%</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedFinding === i ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Finding Description */}
                    <p className="text-slate-300 text-sm leading-relaxed">{finding.description}</p>

                    {/* Expanded Content */}
                    {expandedFinding === i && (
                      <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
                        {/* Code Snippet */}
                        {finding.code_snippet && (
                          <div>
                            <h4 className="text-white font-semibold mb-2">Vulnerable Code</h4>
                            <pre className="bg-slate-800 p-4 rounded text-sm text-slate-300 overflow-x-auto">
                              <code>{finding.code_snippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Remediation */}
                        {finding.remediation && (
                          <div>
                            <h4 className="text-white font-semibold mb-3">Remediation</h4>
                            <p className="text-slate-300 text-sm">{finding.remediation}</p>
                          </div>
                        )}

                        {/* Copy Button */}
                        <Button 
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            const text = `${finding.vulnerability_type}\nSeverity: ${finding.severity}\n\n${finding.description}\n\n${finding.remediation || ''}`
                            navigator.clipboard.writeText(text)
                            alert('Finding copied to clipboard!')
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Finding Details
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}