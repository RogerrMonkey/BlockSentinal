'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ScanListItem } from '@/lib/types'

export function StatsBar() {
  const [stats, setStats] = useState({
    totalScans: 0,
    critical: 0,
    high: 0,
    mediumLow: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.listScans({ limit: 100 })
        const scans = data.scans
        
        // Calculate stats from scans
        setStats({
          totalScans: scans.length,
          critical: 0, // TODO: Add severity counts from findings
          high: 0,
          mediumLow: 0,
        })
      } catch (err) {
        console.error('Failed to load stats:', err)
        // Set default stats on error
        setStats({
          totalScans: 0,
          critical: 0,
          high: 0,
          mediumLow: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = [
    { label: 'Total Scans', value: stats.totalScans.toString(), trend: null },
    { label: 'Critical Issues', value: stats.critical.toString(), badge: 'critical' },
    { label: 'High Severity', value: stats.high.toString(), badge: 'high' },
    { label: 'Medium/Low', value: stats.mediumLow.toString(), badge: 'medium' },
  ]

  const getBadgeColor = (badge?: string) => {
    switch(badge) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      default: return 'text-white'
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <Card key={i} className="bg-slate-900 p-6">
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statItems.map((stat, i) => (
        <Card key={i} className="bg-slate-900 p-6">
          <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
          <div className="flex items-center justify-between">
            <span className={`text-3xl font-bold ${getBadgeColor(stat.badge)}`}>
              {stat.value}
            </span>
            {stat.trend && <span className="text-green-400 text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4" />{stat.trend}</span>}
          </div>
        </Card>
      ))}
    </div>
  )
}