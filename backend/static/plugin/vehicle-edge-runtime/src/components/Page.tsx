// Vehicle Edge Runtime Plugin - Main Page Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React
const ReactDOM: any = (globalThis as any).ReactDOM

import { VehicleApp, DeploymentConfig, VehicleEdgeRuntimeKit } from '../types'
import { useConsoleOutput } from '../hooks/useConsoleOutput'
import { getStatusColor, formatTimestamp } from '../utils/helpers'

// Icon components (simplified - using unicode for now)
const Icons = {
  Rocket: () => '🚀',
  Terminal: () => '💻',
  Play: () => '▶️',
  Stop: () => '⏹️',
  Pause: () => '⏸️',
  Refresh: () => '🔄',
  Trash: () => '🗑️',
  Settings: () => '⚙️',
  Alert: () => '⚠️',
  Check: () => '✅',
  Server: () => '🖥️',
  Package: () => '📦',
  Clock: () => '🕐',
  Wifi: () => '📶',
  WifiOff: () => '📵'
}

type TabType = 'deploy' | 'apps'

interface PageProps {
  data?: any
  config?: any
  api?: any
}

export default function Page({ data, config, api }: PageProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('deploy')
  const [selectedKit, setSelectedKit] = React.useState<VehicleEdgeRuntimeKit | null>(null)
  const [kits, setKits] = React.useState<VehicleEdgeRuntimeKit[]>([])
  const [vehicleApps, setVehicleApps] = React.useState<VehicleApp[]>([])
  const [isConnected, setIsConnected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  // Deployment state
  const [deploymentConfig, setDeploymentConfig] = React.useState<DeploymentConfig>({
    type: 'python',
    code: `import time
import asyncio

print("🚗 Vehicle Edge Runtime Application")
print("=" * 50)

try:
    for i in range(60):  # 60 cycles = 10 minutes (10 seconds each)
        print(f"📡 Processing cycle {i + 1}/60")
        print(f"⏰ Timestamp: {time.strftime('%H:%M:%S')}")
        await asyncio.sleep(10)
        print(f"✅ Cycle {i + 1} completed")
        print("-" * 30)
    print("🎉 Application completed successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
print("📊 Application execution finished")`,
    entryPoint: 'main.py'
  })
  const [appName, setAppName] = React.useState('my-vehicle-app')
  const [isDeploying, setIsDeploying] = React.useState(false)

  // Console output
  const { entries: consoleEntries, addEntry, addSuccess, addError, clear: clearConsole } = useConsoleOutput()

  // Simulate kit connection (replace with real WebSocket connection)
  React.useEffect(() => {
    // Mock kits data - replace with real API call
    const mockKits: VehicleEdgeRuntimeKit[] = [
      {
        kit_id: 'kit-001',
        name: 'Vehicle Edge Kit 1',
        is_online: true,
        noSubscriber: 1,
        description: 'Test runtime device'
      },
      {
        kit_id: 'kit-002',
        name: 'Vehicle Edge Kit 2',
        is_online: false,
        noSubscriber: 0,
        description: 'Offline device'
      }
    ]
    setKits(mockKits)

    // Auto-select first online kit
    const onlineKits = mockKits.filter(k => k.is_online)
    if (onlineKits.length > 0) {
      setSelectedKit(onlineKits[0])
      setIsConnected(true)
      addSuccess(`Connected to ${onlineKits[0].name}`)
    }

    // Simulate fetching running apps
    const mockApps: VehicleApp[] = [
      {
        id: 'app-001',
        name: 'hello-world',
        type: 'python',
        status: 'running',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        executionId: 'app-001',
        resources: {
          cpu_limit: '50%',
          memory_limit: '512MB'
        }
      }
    ]
    setVehicleApps(mockApps)
  }, [addSuccess, addError])

  // Deploy application
  const handleDeploy = async () => {
    if (!selectedKit || !selectedKit.is_online) {
      addError('No online runtime selected')
      return
    }

    if (!appName.trim()) {
      addError('Please enter an application name')
      return
    }

    setIsDeploying(true)
    addEntry(`Starting deployment of ${deploymentConfig.type} app...`, 'info')

    try {
      // Simulate deployment (replace with real API call)
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newApp: VehicleApp = {
        id: appName,
        name: appName,
        type: deploymentConfig.type,
        status: 'running',
        created_at: new Date().toISOString(),
        executionId: appName
      }

      setVehicleApps(prev => [newApp, ...prev])
      addSuccess(`Application "${appName}" deployed successfully to ${selectedKit.name}`)
      setActiveTab('apps')
    } catch (error) {
      addError(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeploying(false)
    }
  }

  // Application control actions
  const handleStartApp = async (appId: string) => {
    addEntry(`Starting application: ${appId}...`, 'info')
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setVehicleApps(prev => prev.map(app =>
      app.id === appId ? { ...app, status: 'running' as const } : app
    ))
    addSuccess(`Application ${appId} started`)
  }

  const handleStopApp = async (appId: string) => {
    addEntry(`Stopping application: ${appId}...`, 'info')
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setVehicleApps(prev => prev.map(app =>
      app.id === appId ? { ...app, status: 'stopped' as const } : app
    ))
    addSuccess(`Application ${appId} stopped`)
  }

  const handleUninstallApp = async (appId: string) => {
    if (!confirm(`Are you sure you want to uninstall "${appId}"?`)) {
      return
    }
    addEntry(`Uninstalling application: ${appId}...`, 'info')
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setVehicleApps(prev => prev.filter(app => app.id !== appId))
    addSuccess(`Application ${appId} uninstalled`)
  }

  // Styles
  const styles = {
    container: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      color: '#333'
    },
    header: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e5e5',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '600',
      margin: 0
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e5e5',
      padding: '0 24px'
    },
    tab: {
      padding: '12px 24px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      fontSize: '14px',
      fontWeight: '500'
    },
    activeTab: {
      borderBottomColor: '#0066cc',
      color: '#0066cc'
    },
    content: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e5e5',
      marginBottom: '16px'
    },
    cardHeader: {
      padding: '16px',
      borderBottom: '1px solid #e5e5e5',
      fontWeight: '600',
      fontSize: '16px'
    },
    cardBody: {
      padding: '16px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box' as const
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '13px',
      fontFamily: 'monospace',
      minHeight: '300px',
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      backgroundColor: '#0066cc',
      color: 'white'
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    buttonSecondary: {
      backgroundColor: '#6c757d'
    },
    buttonDanger: {
      backgroundColor: '#dc3545'
    },
    buttonSmall: {
      padding: '6px 12px',
      fontSize: '12px'
    },
    statusBadge: (status: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500'
    }),
    consoleOutput: {
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      padding: '16px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '13px',
      maxHeight: '400px',
      overflowY: 'auto' as const
    },
    consoleLine: (type: string) => ({
      marginBottom: '4px',
      color: type === 'error' ? '#f48771' : type === 'success' ? '#89d185' : '#d4d4d4'
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '16px'
    }
  }

  // Render function
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Vehicle Edge Runtime {Icons.Rocket()}</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0 0' }}>
            Deploy and manage vehicle applications
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {selectedKit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isConnected ? Icons.Wifi() : Icons.WifiOff()}
              <select
                value={selectedKit.kit_id}
                onChange={(e) => {
                  const kit = kits.find(k => k.kit_id === e.target.value)
                  if (kit) setSelectedKit(kit)
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {kits.map(kit => (
                  <option key={kit.kit_id} value={kit.kit_id}>
                    {kit.name} {kit.is_online ? '🟢' : '🔴'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('deploy')}
          style={{
            ...styles.tab,
            ...(activeTab === 'deploy' ? styles.activeTab : {})
          }}
        >
          {Icons.Terminal()} Deploy Application
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          style={{
            ...styles.tab,
            ...(activeTab === 'apps' ? styles.activeTab : {})
          }}
        >
          {Icons.Package()} Applications ({vehicleApps.length})
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'deploy' && (
          <div>
            {/* Deployment Form */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>Deploy New Application</div>
              <div style={styles.cardBody}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="my-vehicle-app"
                    style={styles.input}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Application Type
                  </label>
                  <select
                    value={deploymentConfig.type}
                    onChange={(e) => setDeploymentConfig(prev => ({
                      ...prev,
                      type: e.target.value as DeploymentConfig['type']
                    }))}
                    style={styles.input}
                  >
                    <option value="python">Python Application</option>
                    <option value="binary">Binary Application</option>
                    <option value="docker">Docker Container</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Application Code
                  </label>
                  <textarea
                    value={deploymentConfig.code}
                    onChange={(e) => setDeploymentConfig(prev => ({
                      ...prev,
                      code: e.target.value
                    }))}
                    style={styles.textarea}
                  />
                </div>

                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !selectedKit?.is_online}
                  style={{
                    ...styles.button,
                    ...(isDeploying || !selectedKit?.is_online ? styles.buttonDisabled : {})
                  }}
                >
                  {isDeploying ? 'Deploying...' : `${Icons.Rocket()} Deploy Application`}
                </button>

                {!selectedKit?.is_online && selectedKit && (
                  <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '8px' }}>
                    {Icons.Alert()} Selected runtime is offline. Please select an online runtime.
                  </p>
                )}
              </div>
            </div>

            {/* Console Output */}
            {consoleEntries.length > 0 && (
              <div style={styles.card}>
                <div style={{ ...styles.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Console Output</span>
                  <button
                    onClick={clearConsole}
                    style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary }}
                  >
                    Clear
                  </button>
                </div>
                <div style={styles.consoleOutput}>
                  {consoleEntries.map(entry => (
                    <div key={entry.id} style={styles.consoleLine(entry.type)}>
                      [{entry.timestamp.toLocaleTimeString()}] {entry.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'apps' && (
          <div>
            {/* Applications List */}
            <div style={styles.card}>
              <div style={{ ...styles.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Running Applications</span>
                <button
                  onClick={() => setActiveTab('deploy')}
                  style={{ ...styles.button, ...styles.buttonSmall }}
                >
                  {Icons.Rocket()} Deploy New
                </button>
              </div>
              <div style={styles.cardBody}>
                {vehicleApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                    {Icons.Package()}
                    <p style={{ marginTop: '16px' }}>No applications deployed yet.</p>
                    <button
                      onClick={() => setActiveTab('deploy')}
                      style={{ ...styles.button, marginTop: '16px' }}
                    >
                      Deploy Your First Application
                    </button>
                  </div>
                ) : (
                  <div style={styles.grid}>
                    {vehicleApps.map(app => (
                      <div
                        key={app.id}
                        style={{
                          border: '1px solid #e5e5e5',
                          borderRadius: '6px',
                          padding: '16px',
                          backgroundColor: 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                              {app.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                              {app.type} • {formatTimestamp(app.created_at)}
                            </p>
                          </div>
                          <span style={{
                            ...styles.statusBadge(app.status),
                            backgroundColor: getStatusColor(app.status).split(' ')[1],
                            color: getStatusColor(app.status).split(' ')[0]
                          }}>
                            {app.status}
                          </span>
                        </div>

                        {app.resources && (
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                            <div>CPU: {app.resources.cpu_limit || 'N/A'}</div>
                            <div>Memory: {app.resources.memory_limit || 'N/A'}</div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {app.status === 'stopped' || app.status === 'error' ? (
                            <button
                              onClick={() => handleStartApp(app.id)}
                              style={{ ...styles.button, ...styles.buttonSmall, fontSize: '12px' }}
                            >
                              {Icons.Play()} Start
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStopApp(app.id)}
                              style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary, fontSize: '12px' }}
                            >
                              {Icons.Stop()} Stop
                            </button>
                          )}
                          <button
                            onClick={() => handleUninstallApp(app.id)}
                            style={{ ...styles.button, ...styles.buttonSmall, ...styles.buttonDanger, fontSize: '12px' }}
                          >
                            {Icons.Trash()} Uninstall
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
