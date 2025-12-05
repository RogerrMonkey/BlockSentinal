'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Copy, RotateCw, Trash2 } from 'lucide-react'

const apiKeys = [
  { name: 'Production', key: 'sk_live_••••••••1234', created: '2024-01-15', lastUsed: '2 hours ago' },
  { name: 'Development', key: 'sk_dev_••••••••5678', created: '2024-01-10', lastUsed: '30 minutes ago' },
]

export default function ApiKeysPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar isLoggedIn={false} setIsLoggedIn={setIsLoggedIn} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Please connect your wallet to manage API keys</p>
            <Button onClick={() => setIsLoggedIn(true)} className="bg-blue-600 hover:bg-blue-700">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      
      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
            <p className="text-slate-400">Manage your API keys for programmatic access</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Generate New Key</Button>
        </div>

            {/* API Keys Table */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-6 py-4 text-left text-white font-semibold">Name</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">API Key</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Created</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Last Used</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((apiKey, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 text-white font-semibold">{apiKey.name}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono flex items-center gap-2">
                          {apiKey.key}
                          <Copy className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
                        </td>
                        <td className="px-6 py-4 text-slate-400">{apiKey.created}</td>
                        <td className="px-6 py-4 text-slate-400">{apiKey.lastUsed}</td>
                        <td className="px-6 py-4 flex gap-2">
                          <Button variant="outline" size="sm" className="border-slate-600 text-slate-400 hover:text-white">
                            <RotateCw className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-slate-600 text-slate-400 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* API Documentation */}
            <Card className="bg-slate-900 border-slate-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">API Documentation</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Quick Start - cURL</p>
                  <pre className="bg-slate-800 p-4 rounded text-sm text-slate-300 overflow-x-auto">
                    {`curl -X POST https://api.blocksentinel.io/scan \\
  -H "Authorization: Bearer sk_live_••••••••1234" \\
  -F "file=@contract.sol"`}
                  </pre>
                </div>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white w-full">
                  View Full API Documentation
                </Button>
              </div>
            </Card>
          </div>
        </main>
    </div>
  )
}