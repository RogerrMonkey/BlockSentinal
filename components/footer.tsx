'use client'

import { Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span>by</span>
          <a 
            href="https://github.com/RogerrMonkey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            RogerrMonkey
          </a>
        </div>
      </div>
    </footer>
  )
}
