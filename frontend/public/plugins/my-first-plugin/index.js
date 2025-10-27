// My First AutoWRX Plugin
class MyFirstPlugin {
  constructor() {
    this.api = window.AutoWRXPluginAPI
  }

  async activate() {
    console.log('🎯 My First Plugin activated!')
    
    this.api.registerTab({
      id: 'first-tab',
      label: 'My First Tab',
      icon: '🎯',
      path: '/first',
      component: 'FirstComponent',
      position: 3
    })

    this.api.showToast('My First Plugin loaded successfully!', 'success')
  }

  async deactivate() {
    this.api.unregisterTab('first-tab')
  }

  getComponent(componentName) {
    if (componentName === 'FirstComponent') {
      return function FirstComponent() {
        const api = window.AutoWRXPluginAPI
        const [counter, setCounter] = React.useState(0)
        const [message, setMessage] = React.useState('')

        const handleButtonClick = () => {
          const newCount = counter + 1
          setCounter(newCount)
          api.showToast(`Clicked ${newCount} times!`, 'success')
        }

        const handleSaveMessage = async () => {
          await api.setStorage('my-message', message)
          api.showToast('Message saved!', 'success')
        }

        const handleLoadMessage = async () => {
          const saved = await api.getStorage('my-message')
          if (saved) {
            setMessage(saved)
            api.showToast('Message loaded!', 'info')
          } else {
            api.showToast('No saved message found', 'info')
          }
        }

        return React.createElement('div', {
          className: 'p-8 max-w-2xl mx-auto'
        }, [
          React.createElement('h1', {
            key: 'title',
            className: 'text-3xl font-bold mb-6 text-purple-600'
          }, '🎯 My First Plugin'),

          React.createElement('div', {
            key: 'content',
            className: 'space-y-6'
          }, [
            // Counter Section
            React.createElement('div', {
              key: 'counter',
              className: 'bg-blue-50 p-6 rounded-lg'
            }, [
              React.createElement('h2', {
                key: 'counter-title',
                className: 'text-xl font-semibold mb-4'
              }, '🔢 Counter Demo'),
              React.createElement('div', {
                key: 'counter-display',
                className: 'text-2xl font-bold mb-4 text-blue-600'
              }, `Count: ${counter}`),
              React.createElement('button', {
                key: 'counter-btn',
                className: 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600',
                onClick: handleButtonClick
              }, 'Click Me!')
            ]),

            // Message Section
            React.createElement('div', {
              key: 'message',
              className: 'bg-green-50 p-6 rounded-lg'
            }, [
              React.createElement('h2', {
                key: 'message-title',
                className: 'text-xl font-semibold mb-4'
              }, '💾 Storage Demo'),
              React.createElement('input', {
                key: 'message-input',
                type: 'text',
                value: message,
                onChange: (e) => setMessage(e.target.value),
                placeholder: 'Type a message...',
                className: 'w-full p-2 border rounded mb-4'
              }),
              React.createElement('div', {
                key: 'message-buttons',
                className: 'space-x-2'
              }, [
                React.createElement('button', {
                  key: 'save-btn',
                  className: 'bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600',
                  onClick: handleSaveMessage
                }, 'Save Message'),
                React.createElement('button', {
                  key: 'load-btn',
                  className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600',
                  onClick: handleLoadMessage
                }, 'Load Message')
              ])
            ]),

            // API Demo Section
            React.createElement('div', {
              key: 'api-demo',
              className: 'bg-yellow-50 p-6 rounded-lg'
            }, [
              React.createElement('h2', {
                key: 'api-title',
                className: 'text-xl font-semibold mb-4'
              }, '🔌 API Demo'),
              React.createElement('div', {
                key: 'api-buttons',
                className: 'space-x-2'
              }, [
                React.createElement('button', {
                  key: 'toast-btn',
                  className: 'bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600',
                  onClick: () => api.showToast('Hello from my plugin!', 'info')
                }, 'Show Toast'),
                React.createElement('button', {
                  key: 'data-btn',
                  className: 'bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600',
                  onClick: () => {
                    const data = api.getVehicleData()
                    console.log('Vehicle Data:', data)
                    api.showToast('Check console for vehicle data', 'info')
                  }
                }, 'Get Vehicle Data')
              ])
            ])
          ])
        ])
      }
    }
    return null
  }
}

window.MyFirstPlugin = MyFirstPlugin