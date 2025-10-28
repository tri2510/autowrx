class WeatherInsightsPlugin {
  constructor() {
    this.components = {
      WeatherDashboard: this.renderDashboard.bind(this)
    }
  }

  async activate() {
    const api = window.AutoWRXPluginAPI
    if (!api) {
      throw new Error('AutoWRXPluginAPI is not available')
    }

    api.registerTab({
      id: 'weather-dashboard',
      label: 'Weather Insights',
      icon: '☀️',
      component: 'WeatherDashboard',
      path: '/plugin/weather-insights',
      position: 190
    })

    api.showToast('Weather Insights plugin activated', 'success')
  }

  async deactivate() {
    const api = window.AutoWRXPluginAPI
    if (api) {
      api.unregisterTab('weather-dashboard')
    }
  }

  getComponent(componentName) {
    return this.components[componentName] || null
  }

  renderDashboard() {
    const React = window.React
    const vehicleData = window.AutoWRXPluginAPI?.getVehicleData() || {}

    const forecast = [
      { day: 'Today', icon: '☀️', temperature: '24°C', condition: 'Clear', advisory: 'Ideal driving conditions' },
      { day: 'Tomorrow', icon: '🌧️', temperature: '19°C', condition: 'Light rain', advisory: 'Enable rain-sensing wipers' },
      { day: 'In 2 days', icon: '⛈️', temperature: '17°C', condition: 'Stormy', advisory: 'Delay non-essential trips' }
    ]

    return React.createElement('div', { className: 'p-8 space-y-6 bg-slate-950/40 rounded-xl border border-slate-700 text-slate-100' }, [
      React.createElement('div', { key: 'header', className: 'flex items-center justify-between' }, [
        React.createElement('div', { key: 'title' }, [
          React.createElement('h1', { key: 'headline', className: 'text-3xl font-semibold flex items-center gap-3' }, [
            React.createElement('span', { key: 'icon', className: 'text-4xl' }, '🌤️'),
            'Weather Insights'
          ]),
          React.createElement('p', { key: 'subtitle', className: 'text-slate-300 mt-2 max-w-2xl' }, 'Dynamic plugin installed through the Extension Center. Uses mocked forecast data and the shared plugin API to showcase vehicle-aware recommendations.')
        ]),
        React.createElement('div', { key: 'vehicle', className: 'text-right text-sm text-slate-300' }, [
          React.createElement('div', { key: 'vehicle-label', className: 'uppercase tracking-wide text-slate-400' }, 'Selected vehicle'),
          React.createElement('div', { key: 'vehicle-name', className: 'text-lg text-white font-medium' }, vehicleData.model?.name || 'BMW X3 2024'),
          React.createElement('div', { key: 'vehicle-version', className: 'text-slate-400' }, vehicleData.model?.version || 'v2.1.0')
        ])
      ]),
      React.createElement('div', { key: 'grid', className: 'grid gap-4 grid-cols-1 md:grid-cols-3' },
        forecast.map((item) => React.createElement('div', {
          key: item.day,
          className: 'bg-slate-900/80 border border-slate-700 rounded-lg p-4 space-y-3 shadow-inner'
        }, [
          React.createElement('div', { key: 'day', className: 'flex items-center justify-between' }, [
            React.createElement('span', { key: 'label', className: 'text-sm uppercase tracking-wide text-slate-400' }, item.day),
            React.createElement('span', { key: 'icon', className: 'text-2xl' }, item.icon)
          ]),
          React.createElement('div', { key: 'temp', className: 'text-3xl font-semibold text-white' }, item.temperature),
          React.createElement('div', { key: 'condition', className: 'text-slate-300' }, item.condition),
          React.createElement('div', { key: 'advisory', className: 'text-sm text-amber-300 flex items-start gap-2' }, [
            React.createElement('span', { key: 'dot', className: 'mt-1 text-base' }, '•'),
            React.createElement('span', { key: 'text' }, item.advisory)
          ])
        ]))
      ),
      React.createElement('div', { key: 'cta', className: 'bg-blue-500/10 border border-blue-500/40 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3' }, [
        React.createElement('div', { key: 'cta-text' }, [
          React.createElement('div', { key: 'cta-title', className: 'text-blue-200 font-semibold' }, 'Ready to build your own extension?'),
          React.createElement('p', { key: 'cta-body', className: 'text-sm text-blue-100/90 max-w-xl' }, 'Head to the Extension Center to upload a plugin bundle. The local registry will make it available to your team instantly.')
        ]),
        React.createElement('button', {
          key: 'cta-button',
          className: 'px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-400 transition-colors',
          onClick: () => window.AutoWRXPluginAPI?.navigate('/extensions')
        }, 'Open Extension Center')
      ])
    ])
  }
}

module.exports = WeatherInsightsPlugin
