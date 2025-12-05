// API client for BlockSentinel backend

import {
  ScanCreate,
  ScanResponse,
  ScanListResponse,
  ReportResponse,
  ApiError,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: `HTTP error ${response.status}`,
      }))
      throw new Error(error.detail)
    }
    return response.json()
  }

  /**
   * Create a new scan
   */
  async createScan(data: ScanCreate): Promise<ScanResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      return this.handleResponse<ScanResponse>(response)
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Backend API is not running. Please start the backend server.')
      }
      throw error
    }
  }

  /**
   * Get scan status and summary
   */
  async getScan(scanId: string): Promise<ScanResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/scans/${scanId}`)
      return this.handleResponse<ScanResponse>(response)
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Backend API is not running. Please start the backend server.')
      }
      throw error
    }
  }

  /**
   * List scans with pagination
   */
  async listScans(params?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<ScanListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.status) queryParams.append('status', params.status)

    const url = `${this.baseUrl}/scans${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    try {
      const response = await fetch(url)
      return this.handleResponse<ScanListResponse>(response)
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Backend API is not running. Please start the backend server.')
      }
      throw error
    }
  }

  /**
   * Get full scan report with findings
   */
  async getScanReport(scanId: string): Promise<ReportResponse> {
    const response = await fetch(`${this.baseUrl}/scans/${scanId}/report`)
    return this.handleResponse<ReportResponse>(response)
  }

  /**
   * Delete a scan
   */
  async deleteScan(scanId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/scans/${scanId}`, {
      method: 'DELETE',
    })
    return this.handleResponse<{ message: string }>(response)
  }

  /**
   * Poll scan status until completed or failed
   */
  async pollScanStatus(
    scanId: string,
    onUpdate?: (scan: ScanResponse) => void,
    intervalMs: number = 2000,
    maxAttempts: number = 60
  ): Promise<ScanResponse> {
    let attempts = 0

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const scan = await this.getScan(scanId)
          
          if (onUpdate) {
            onUpdate(scan)
          }

          if (scan.status === 'completed' || scan.status === 'failed') {
            resolve(scan)
            return
          }

          attempts++
          if (attempts >= maxAttempts) {
            reject(new Error('Scan polling timeout'))
            return
          }

          setTimeout(poll, intervalMs)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for custom instances
export { ApiClient }
