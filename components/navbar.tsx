'use client'

import { Shield, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConnectButton, useActiveAccount } from 'thirdweb/react'
import { client } from '@/lib/client'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const account = useActiveAccount()
  const address = account?.address

  return (
    <nav className="bg-slate-950/50 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <span className="text-xl font-bold text-white">BlockSentinel</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {address && (
            <>
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors font-medium">Dashboard</Link>
              <Link href="/scan/new" className="text-slate-300 hover:text-white transition-colors font-medium">New Scan</Link>
              <Link href="/reports" className="text-slate-300 hover:text-white transition-colors font-medium">Reports</Link>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-4">
          <div suppressHydrationWarning>
            <ConnectButton 
              client={client}
              theme="dark"
              connectButton={{
                style: {
                  fontSize: '16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  minWidth: '160px',
                  height: '44px',
                },
              }}
              detailsButton={{
                displayBalanceToken: undefined,
                style: {
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                },
              }}
            />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-slate-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800">
          <div className="px-4 py-6 space-y-3">
            {address && (
              <>
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800 transition-colors px-4 py-3 rounded-lg font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/scan/new" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800 transition-colors px-4 py-3 rounded-lg font-medium"
                >
                  New Scan
                </Link>
                <Link 
                  href="/reports" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800 transition-colors px-4 py-3 rounded-lg font-medium"
                >
                  Reports
                </Link>
                <a href="#" className="block text-slate-300 hover:text-white transition">Docs</a>
              </>
            )}
            <div className="pt-4" suppressHydrationWarning>
              <ConnectButton 
                client={client}
                theme="dark"
                connectButton={{
                  style: {
                    fontSize: '16px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    width: '100%',
                    height: '44px',
                  },
                }}
                detailsButton={{
                  displayBalanceToken: undefined,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
