// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface DetectedDevice {
  ip: string
  hostname?: string
  port: number
  status: 'online' | 'offline' | 'unknown'
  lastSeen: Date
  version?: string
}

export class NetworkDiscovery {
  private static readonly DEFAULT_TIMEOUT = 2000
  private static readonly COMMON_PORTS = [3002, 3090]
  private static readonly COMMON_RANGES = [
    '192.168.1',
    '192.168.0',
    '10.0.0',
    '172.16.0',
    '172.17.0', // Docker default range
    '127.0.0'   // Localhost
  ]

  /**
   * Scan for Vehicle Edge Runtime devices on the network
   */
  static async scanForDevices(
    onProgress?: (progress: number, currentIP: string) => void,
    customRanges?: string[]
  ): Promise<DetectedDevice[]> {
    const ranges = customRanges || this.COMMON_RANGES
    const foundDevices: DetectedDevice[] = []
    const totalIps = ranges.length * 20 // Limit scan to first 20 IPs per range for performance
    let checkedIps = 0

    // Add localhost for development and simulation
    try {
      // Check simulation endpoints (Vehicle Edge Runtime and Kit Manager)
      await this.checkDevice('localhost', 3002, foundDevices)
      await this.checkDevice('localhost', 3090, foundDevices)

      // Also check 127.0.0.1 for completeness
      await this.checkDevice('127.0.0.1', 3002, foundDevices)
      await this.checkDevice('127.0.0.1', 3090, foundDevices)
    } catch (error) {
      // Localhost might not be running, that's okay
    }

    // Scan each range (limit to first 20 IPs for performance)
    const scanPromises: Promise<void>[] = []

    for (const range of ranges) {
      for (let i = 1; i <= 20; i++) { // Limit to 20 IPs per range
        const ip = `${range}.${i}`

        scanPromises.push(
          this.checkDevice(ip, 3002, foundDevices)
            .catch(() => {}) // Ignore errors for individual IPs
            .finally(() => {
              checkedIps++
              onProgress?.(Math.round((checkedIps / totalIps) * 100), ip)
            })
        )
      }
    }

    // Execute scans in batches to avoid overwhelming the network
    const batchSize = 10
    for (let i = 0; i < scanPromises.length; i += batchSize) {
      const batch = scanPromises.slice(i, i + batchSize)
      await Promise.allSettled(batch)

      // Small delay between batches
      if (i + batchSize < scanPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return foundDevices.filter((device, index, arr) =>
      arr.findIndex(d => d.ip === device.ip && d.port === device.port) === index
    )
  }

  /**
   * Check if a device is running Vehicle Edge Runtime on a specific port
   */
  private static async checkDevice(
    ip: string,
    port: number,
    foundDevices: DetectedDevice[]
  ): Promise<void> {
    try {
      // Try WebSocket connection first (more reliable for our use case)
      const wsUrl = `ws://${ip}:${port}/runtime`
      const ws = new WebSocket(wsUrl)

      const result = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          ws.close()
          resolve(false)
        }, this.DEFAULT_TIMEOUT)

        ws.onopen = () => {
          clearTimeout(timeout)
          ws.close()
          resolve(true)
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }

        ws.onclose = () => {
          clearTimeout(timeout)
        }
      })

      if (result) {
        foundDevices.push({
          ip,
          port,
          status: 'online',
          lastSeen: new Date(),
          hostname: this.getHostname(ip)
        })
      }
    } catch (error) {
      // If WebSocket fails, try HTTP fallback for health endpoint
      try {
        const response = await fetch(`http://${ip}:${port}/health`, {
          mode: 'no-cors',
          signal: AbortSignal.timeout(1000)
        })

        // If we reach here, something responded
        foundDevices.push({
          ip,
          port,
          status: 'unknown',
          lastSeen: new Date(),
          hostname: this.getHostname(ip)
        })
      } catch (httpError) {
        // Both WebSocket and HTTP failed, device is offline
      }
    }
  }

  /**
   * Generate a hostname for the device based on IP
   */
  private static getHostname(ip: string): string {
    if (ip === 'localhost' || ip === '127.0.0.1') {
      return 'Local Development'
    }

    const segments = ip.split('.')
    return `vehicle-runtime-${segments[2]}-${segments[3]}`
  }

  /**
   * Test connection to a specific device
   */
  static async testConnection(device: DetectedDevice): Promise<boolean> {
    try {
      const wsUrl = device.port === 3002
        ? `ws://${device.ip}:${device.port}/runtime`
        : `ws://${device.ip}:3090`

      const ws = new WebSocket(wsUrl)

      const result = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          ws.close()
          resolve(false)
        }, 5000)

        ws.onopen = () => {
          clearTimeout(timeout)
          ws.close()
          resolve(true)
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }

        ws.onclose = () => {
          clearTimeout(timeout)
        }
      })

      return result
    } catch (error) {
      return false
    }
  }

  /**
   * Get current user's IP network ranges
   */
  static async getLocalNetworkRanges(): Promise<string[]> {
    // This is a simplified version - in a real implementation,
    // you might want to use WebRTC or other methods to detect local network ranges
    return this.COMMON_RANGES
  }

  /**
   * Validate if an IP address is in a valid format
   */
  static isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(ip) || ip === 'localhost'
  }

  /**
   * Add device manually (for user input)
   */
  static addDeviceManually(ip: string, port: number = 3002): DetectedDevice {
    if (!this.isValidIP(ip)) {
      throw new Error('Invalid IP address format')
    }

    return {
      ip,
      port,
      status: 'unknown',
      lastSeen: new Date(),
      hostname: `Manual Entry - ${ip}`
    }
  }
}

export default NetworkDiscovery