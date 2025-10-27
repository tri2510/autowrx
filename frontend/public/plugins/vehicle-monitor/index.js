// Vehicle Monitor Plugin for AutoWRX
class VehicleMonitorPlugin {
  constructor() {
    this.api = window.AutoWRXPluginAPI
  }

  async activate() {
    console.log('🚗 Vehicle Monitor Plugin activated!')
    
    // Register the tab
    this.api.registerTab({
      id: 'vehicle-monitor-tab',
      label: 'Vehicle Monitor',
      icon: '🚗',
      path: '/vehicle-monitor',
      component: 'VehicleMonitorComponent',
      position: 2
    })

    // Subscribe to vehicle data updates
    this.api.subscribeToVehicleUpdates((data) => {
      console.log('Vehicle Monitor: Data updated', data)
    })

    this.api.showToast('Vehicle Monitor Plugin loaded!', 'success')
  }

  async deactivate() {
    console.log('Vehicle Monitor Plugin deactivated')
    this.api.unregisterTab('vehicle-monitor-tab')
  }

  getComponent(componentName) {
    if (componentName === 'VehicleMonitorComponent') {
      return function VehicleMonitorComponent() {
        const api = window.AutoWRXPluginAPI
        const [vehicleData, setVehicleData] = React.useState(null)
        const [isConnected, setIsConnected] = React.useState(false)
        const [lastUpdate, setLastUpdate] = React.useState(new Date())

        React.useEffect(() => {
          // Get initial vehicle data
          const data = api.getVehicleData()
          setVehicleData(data)
          setIsConnected(true)
          
          // Simulate real-time updates
          const interval = setInterval(() => {
            setLastUpdate(new Date())
          }, 1000)

          return () => clearInterval(interval)
        }, [])

        const mockSignals = {
          'Vehicle.Speed': Math.floor(Math.random() * 120),
          'Vehicle.Engine.RPM': Math.floor(Math.random() * 6000),
          'Vehicle.Engine.Temperature': Math.floor(Math.random() * 100 + 60),
          'Vehicle.Fuel.Level': Math.floor(Math.random() * 100),
          'Vehicle.Battery.Voltage': (Math.random() * 2 + 11).toFixed(1),
        }

        const handleSaveData = async () => {
          const reportData = {
            timestamp: new Date().toISOString(),
            signals: mockSignals,
            notes: 'Vehicle monitor snapshot'
          }
          
          await api.setStorage('monitor-report', reportData)
          api.showToast('Vehicle data saved!', 'success')
        }

        const handleExportData = () => {
          const exportData = {
            timestamp: new Date().toISOString(),
            signals: mockSignals,
            summary: 'Vehicle monitoring export'
          }
          
          console.log('Exported Data:', exportData)
          api.showToast('Data exported to console', 'info')
        }

        return React.createElement('div', {
          className: 'p-6 max-w-6xl mx-auto'
        }, [
          // Header
          React.createElement('div', {
            key: 'header',
            className: 'mb-8'
          }, [
            React.createElement('h1', {
              key: 'title',
              className: 'text-3xl font-bold text-gray-900 mb-2'
            }, '🚗 Vehicle Monitor'),
            React.createElement('p', {
              key: 'subtitle',
              className: 'text-gray-600'
            }, 'Real-time vehicle data monitoring and analysis'),
            React.createElement('div', {
              key: 'status',
              className: `inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`
            }, [
              React.createElement('div', {
                key: 'indicator',
                className: `w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`
              }),
              isConnected ? 'Connected' : 'Disconnected'
            ])
          ]),

          // Main Dashboard
          React.createElement('div', {
            key: 'dashboard',
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'
          }, Object.entries(mockSignals).map(([signal, value]) => 
            React.createElement('div', {
              key: signal,
              className: 'bg-white rounded-lg shadow-md p-6 border border-gray-200'
            }, [
              React.createElement('h3', {
                key: 'signal-name',
                className: 'text-sm font-medium text-gray-500 mb-2'
              }, signal.replace('Vehicle.', '').replace('.', ' ')),
              React.createElement('div', {
                key: 'signal-value',
                className: 'text-2xl font-bold text-gray-900'
              }, value),
              React.createElement('div', {
                key: 'signal-unit',
                className: 'text-xs text-gray-400'
              }, getUnit(signal))
            ])
          )),

          // Control Panel
          React.createElement('div', {
            key: 'controls',
            className: 'bg-gray-50 rounded-lg p-6'
          }, [
            React.createElement('h2', {
              key: 'controls-title',
              className: 'text-xl font-semibold mb-4'
            }, '🎛️ Control Panel'),
            React.createElement('div', {
              key: 'controls-grid',
              className: 'grid grid-cols-1 md:grid-cols-3 gap-4'
            }, [
              React.createElement('button', {
                key: 'save-btn',
                className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
                onClick: handleSaveData
              }, '💾 Save Current Data'),
              React.createElement('button', {
                key: 'export-btn',
                className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
                onClick: handleExportData
              }, '📊 Export Report'),
              React.createElement('button', {
                key: 'refresh-btn',
                className: 'bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700',
                onClick: () => api.showToast('Data refreshed!', 'info')
              }, '🔄 Refresh Data')
            ]),
            React.createElement('div', {
              key: 'last-update',
              className: 'mt-4 text-sm text-gray-500'
            }, `Last update: ${lastUpdate.toLocaleTimeString()}`)
          ])
        ])

        function getUnit(signal) {
          if (signal.includes('Speed')) return 'km/h'
          if (signal.includes('RPM')) return 'rpm'
          if (signal.includes('Temperature')) return '°C'
          if (signal.includes('Level')) return '%'
          if (signal.includes('Voltage')) return 'V'
          return ''
        }
      }
    }
    return null
  }
}

// Export the plugin
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VehicleMonitorPlugin
} else {
  window.VehicleMonitorPlugin = VehicleMonitorPlugin
}