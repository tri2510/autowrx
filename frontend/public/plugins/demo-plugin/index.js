// Demo Plugin for AutoWRX Plugin System
class DemoPlugin {
  constructor() {
    this.api = window.AutoWRXPluginAPI
  }

  async activate() {
    console.log('Demo Plugin activated!')
    
    this.api.registerTab({
      id: 'demo-tab',
      label: 'Demo',
      icon: '✨',
      path: '/demo',
      component: 'DemoComponent',
      position: 1
    })

    this.api.showToast('Demo Plugin loaded successfully!', 'success')
  }

  async deactivate() {
    console.log('Demo Plugin deactivated')
    this.api.unregisterTab('demo-tab')
  }

  getComponent(componentName) {
    if (componentName === 'DemoComponent') {
      return function DemoComponent() {
        const api = window.AutoWRXPluginAPI
        
        return React.createElement('div', {
          className: 'p-8 max-w-4xl mx-auto'
        }, [
          React.createElement('h1', {
            key: 'title',
            className: 'text-3xl font-bold mb-6 text-gray-900'
          }, '🎉 Plugin System Demo'),
          
          React.createElement('div', {
            key: 'content',
            className: 'grid grid-cols-1 md:grid-cols-2 gap-6'
          }, [
            React.createElement('div', {
              key: 'info',
              className: 'bg-blue-50 p-6 rounded-lg border border-blue-200'
            }, [
              React.createElement('h2', {
                key: 'info-title',
                className: 'text-xl font-semibold mb-4 text-blue-800'
              }, '✅ Plugin System Working!'),
              React.createElement('p', {
                key: 'info-text',
                className: 'text-blue-700 mb-4'
              }, 'This tab was dynamically created by a plugin. The plugin system successfully:'),
              React.createElement('ul', {
                key: 'info-list',
                className: 'list-disc list-inside text-blue-700 space-y-2'
              }, [
                React.createElement('li', { key: '1' }, 'Loaded the plugin from /plugins/demo-plugin/'),
                React.createElement('li', { key: '2' }, 'Registered this tab dynamically'),
                React.createElement('li', { key: '3' }, 'Rendered this React component'),
                React.createElement('li', { key: '4' }, 'Provided access to the Plugin API')
              ])
            ]),
            
            React.createElement('div', {
              key: 'actions',
              className: 'bg-green-50 p-6 rounded-lg border border-green-200'
            }, [
              React.createElement('h2', {
                key: 'actions-title',
                className: 'text-xl font-semibold mb-4 text-green-800'
              }, '🚀 Try Plugin Features'),
              React.createElement('div', {
                key: 'actions-content',
                className: 'space-y-4'
              }, [
                React.createElement('button', {
                  key: 'toast-btn',
                  className: 'w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
                  onClick: () => api.showToast('Hello from plugin!', 'success')
                }, 'Show Success Toast'),
                
                React.createElement('button', {
                  key: 'error-btn',
                  className: 'w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
                  onClick: () => api.showToast('Plugin error demo', 'error')
                }, 'Show Error Toast'),
                
                React.createElement('button', {
                  key: 'data-btn',
                  className: 'w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
                  onClick: () => {
                    const data = api.getVehicleData()
                    console.log('Vehicle Data:', data)
                    api.showToast('Check console for vehicle data', 'info')
                  }
                }, 'Get Vehicle Data'),
                
                React.createElement('button', {
                  key: 'storage-btn',
                  className: 'w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700',
                  onClick: async () => {
                    const timestamp = new Date().toISOString()
                    await api.setStorage('demo-data', { timestamp, message: 'Hello from storage!' })
                    const stored = await api.getStorage('demo-data')
                    api.showToast(`Stored: ${stored.message}`, 'success')
                  }
                }, 'Test Plugin Storage')
              ])
            ])
          ]),
          
          React.createElement('div', {
            key: 'docs',
            className: 'mt-8 bg-gray-50 p-6 rounded-lg'
          }, [
            React.createElement('h2', {
              key: 'docs-title',
              className: 'text-xl font-semibold mb-4'
            }, '📚 Next Steps'),
            React.createElement('p', {
              key: 'docs-text',
              className: 'text-gray-700 mb-4'
            }, 'Now you can:'),
            React.createElement('ul', {
              key: 'docs-list',
              className: 'list-disc list-inside text-gray-700 space-y-1'
            }, [
              React.createElement('li', { key: 'doc1' }, 'Check the ASPICE plugin example at /plugins/aspice-plugin/'),
              React.createElement('li', { key: 'doc2' }, 'Read the plugin development guide in /docs/plugin-development-guide.md'),
              React.createElement('li', { key: 'doc3' }, 'Create your own plugin following the documentation'),
              React.createElement('li', { key: 'doc4' }, 'Test hot reload by editing plugin files')
            ])
          ])
        ])
      }
    }
    return null
  }
}

// Export the plugin class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemoPlugin
} else {
  window.DemoPlugin = DemoPlugin
}