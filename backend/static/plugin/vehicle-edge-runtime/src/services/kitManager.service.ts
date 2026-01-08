// Kit Manager Service - Real REST API connection
// Based on original implementation from feature/270-new-deployment-extension

export interface VehicleEdgeRuntimeKit {
  socket_id: string
  kit_id: string
  name: string
  last_seen: number
  is_online: boolean
  noRunner: number
  noSubscriber: number
  support_apis: string[]
  desc: string
}

export class KitManagerService {
  private baseUrl: string

  constructor(baseUrl: string = 'https://kit.digitalauto.tech') {
    this.baseUrl = baseUrl
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  async listKits(): Promise<{ content: VehicleEdgeRuntimeKit[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/listAllKits`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[KitManager] Failed to fetch kits:', error)
      throw error
    }
  }

  async convertCode(code: string): Promise<{ content: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/convertCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[KitManager] Failed to convert code:', error)
      throw error
    }
  }
}
