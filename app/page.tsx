'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Brain, Zap, Search, Shield, X, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useState } from 'react'

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false)
  const vulnerabilities = [
    { name: 'Reentrancy', icon: '🔄' },
    { name: 'Integer Overflow', icon: '📊' },
    { name: 'Access Control', icon: '🔐' },
    { name: 'Unchecked Send', icon: '💸' },
    { name: 'Delegatecall', icon: '📞' },
    { name: 'tx.origin', icon: '👤' },
    { name: 'Front-running', icon: '🏃' },
    { name: 'Timestamp Dependence', icon: '⏰' },
  ]

  const steps = [
    { number: '1', title: 'Upload contract or enter address' },
    { number: '2', title: 'Slither static analysis' },
    { number: '3', title: 'Mythril symbolic execution' },
    { number: '4', title: 'AI analysis with Llama 3.2' },
    { number: '5', title: 'Comprehensive security report' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
          Multi-Layer Smart Contract Security Analysis
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto text-balance">
          Combining Slither, Mythril, and Llama 3.2 AI for comprehensive vulnerability detection.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/scan/new">
            <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg">
              Start Free Scan
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button 
            onClick={() => setShowDemoModal(true)}
            variant="outline" 
            className="border-slate-600 text-white hover:bg-slate-800 h-12 px-8 text-lg"
          >
            View Demo Report
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Choose BlockSentinel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 p-6 hover:bg-slate-900 transition">
            <Brain className="w-10 h-10 text-blue-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">AI-Enhanced Detection</h3>
            <p className="text-slate-400 text-sm">Llama 3.2 3B model for intelligent vulnerability analysis</p>
          </Card>
          <Card className="bg-slate-900/50 p-6 hover:bg-slate-900 transition">
            <Zap className="w-10 h-10 text-yellow-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Instant Reports</h3>
            <p className="text-slate-400 text-sm">Results in under 2 minutes with actionable insights</p>
          </Card>
          <Card className="bg-slate-900/50 p-6 hover:bg-slate-900 transition">
            <Search className="w-10 h-10 text-green-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Explainable Results</h3>
            <p className="text-slate-400 text-sm">Line-by-line vulnerability explanations and fixes</p>
          </Card>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 p-6 hover:bg-slate-900 transition">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="text-lg font-bold text-white mb-2">Slither</h3>
            <p className="text-slate-400 text-sm mb-3">Industry-standard static analysis framework by Trail of Bits</p>
            <ul className="text-slate-500 text-xs space-y-1">
              <li>• 90+ built-in detectors</li>
              <li>• Pattern recognition</li>
              <li>• Code quality checks</li>
            </ul>
          </Card>
          <Card className="bg-slate-900/50 p-6 hover:bg-slate-900 transition">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-bold text-white mb-2">Mythril</h3>
            <p className="text-slate-400 text-sm mb-3">Symbolic execution engine for deep security analysis</p>
            <ul className="text-slate-500 text-xs space-y-1">
              <li>• Logic vulnerability detection</li>
              <li>• State space exploration</li>
              <li>• SMT solving</li>
            </ul>
          </Card>
          <Card className="bg-slate-900/50 p-6 hover:bg-slate-900 transition">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-bold text-white mb-2">Ollama + Llama 3.2</h3>
            <p className="text-slate-400 text-sm mb-3">AI-powered code analysis and vulnerability detection</p>
            <ul className="text-slate-500 text-xs space-y-1">
              <li>• 3B parameter model</li>
              <li>• Context-aware analysis</li>
              <li>• Natural language insights</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Analysis Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mb-3">
                {step.number}
              </div>
              <p className="text-center text-slate-300 text-xs">{step.title}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-blue-600 mt-2 md:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vulnerability Types */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Vulnerabilities We Detect</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {vulnerabilities.map((vuln, i) => (
            <Card key={i} className="bg-slate-900/50 p-4 text-center hover:bg-slate-900 transition">
              <div className="text-2xl mb-1">{vuln.icon}</div>
              <p className="text-white font-semibold text-sm">{vuln.name}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to secure your smart contract?</h2>
          <p className="text-blue-100 mb-6 text-base">Comprehensive security analysis with multi-layer vulnerability detection</p>
          <Link href="/scan/new">
            <Button className="bg-slate-900 text-white hover:bg-slate-800 border-2 border-slate-700 hover:border-slate-600 h-12 px-8 text-lg font-semibold shadow-xl">
              Start Free Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDemoModal(false)}>
          <div className="bg-slate-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Demo Security Report</h2>
              <button onClick={() => setShowDemoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Contract Code */}
              <Card className="bg-slate-800 p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Analyzed Contract</h3>
                <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-slate-300 text-sm font-mono">
{`pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        
        balances[msg.sender] -= amount;
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`}
                  </pre>
                </div>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 p-4">
                  <div className="text-slate-400 text-sm mb-1">Total Findings</div>
                  <div className="text-2xl font-bold text-white">3</div>
                </Card>
                <Card className="bg-red-900/20 border-red-800 p-4">
                  <div className="text-slate-400 text-sm mb-1">Critical</div>
                  <div className="text-2xl font-bold text-red-400">1</div>
                </Card>
                <Card className="bg-orange-900/20 border-orange-800 p-4">
                  <div className="text-slate-400 text-sm mb-1">High</div>
                  <div className="text-2xl font-bold text-orange-400">1</div>
                </Card>
                <Card className="bg-yellow-900/20 border-yellow-800 p-4">
                  <div className="text-slate-400 text-sm mb-1">Medium</div>
                  <div className="text-2xl font-bold text-yellow-400">1</div>
                </Card>
              </div>

              {/* Findings */}
              <div className="space-y-4">
                {/* Finding 1: Reentrancy */}
                <Card className="bg-slate-800 border-red-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-red-900/20 border border-red-800 rounded-full text-red-400 text-xs font-semibold">CRITICAL</span>
                        <span className="px-2 py-1 bg-blue-900/20 border border-blue-800 rounded text-blue-400 text-xs">🔧 Slither</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Reentrancy Vulnerability</h3>
                      <p className="text-slate-300 mb-3">The withdraw function is vulnerable to reentrancy attacks. The external call is made before updating the balance, allowing an attacker to recursively call withdraw.</p>
                      <div className="bg-slate-950 rounded p-3 mb-3">
                        <p className="text-slate-400 text-sm mb-1">Vulnerable Code (Line 12-13):</p>
                        <code className="text-red-400 text-sm font-mono">(bool success, ) = msg.sender.call{'{'}value: amount{'}'}{'}'}("");</code>
                      </div>
                      <div className="bg-green-900/10 border border-green-800 rounded p-3">
                        <p className="text-green-400 text-sm font-semibold mb-1">Recommendation:</p>
                        <p className="text-slate-300 text-sm">Use the Checks-Effects-Interactions pattern. Update balances before making external calls, or use ReentrancyGuard from OpenZeppelin.</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Finding 2: Unchecked Send */}
                <Card className="bg-slate-800 border-orange-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-orange-900/20 border border-orange-800 rounded-full text-orange-400 text-xs font-semibold">HIGH</span>
                        <span className="px-2 py-1 bg-amber-900/20 border border-amber-800 rounded text-amber-400 text-xs">⚡ Mythril</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Unprotected Ether Withdrawal</h3>
                      <p className="text-slate-300 mb-3">Anyone can withdraw their balance without additional access controls. Consider implementing withdrawal limits or time locks.</p>
                      <div className="bg-green-900/10 border border-green-800 rounded p-3">
                        <p className="text-green-400 text-sm font-semibold mb-1">Recommendation:</p>
                        <p className="text-slate-300 text-sm">Add access control modifiers or implement a withdrawal delay mechanism.</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Finding 3: Missing Events */}
                <Card className="bg-slate-800 border-yellow-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-yellow-900/20 border border-yellow-800 rounded-full text-yellow-400 text-xs font-semibold">MEDIUM</span>
                        <span className="px-2 py-1 bg-green-900/20 border border-green-800 rounded text-green-400 text-xs">🤖 AI</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Missing Event Emissions</h3>
                      <p className="text-slate-300 mb-3">The contract does not emit events for deposits and withdrawals, making it difficult to track transactions off-chain.</p>
                      <div className="bg-green-900/10 border border-green-800 rounded p-3">
                        <p className="text-green-400 text-sm font-semibold mb-1">Recommendation:</p>
                        <p className="text-slate-300 text-sm">Add event declarations and emit them in deposit() and withdraw() functions for better transparency.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <Link href="/scan/new" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Scan Your Contract
                  </Button>
                </Link>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setShowDemoModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}