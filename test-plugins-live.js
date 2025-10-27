// Test script to verify plugin system in browser
// Run this in browser console at http://localhost:3210/model/bmw-x3-2024

console.log('🧪 Testing Plugin System...')

// Check if global API is available
if (window.AutoWRXPluginAPI) {
  console.log('✅ AutoWRXPluginAPI is available')
  console.log('📋 Available API methods:', Object.keys(window.AutoWRXPluginAPI))
} else {
  console.log('❌ AutoWRXPluginAPI not found')
}

// Check if React is available
if (window.React) {
  console.log('✅ React is available globally')
} else {
  console.log('❌ React not available globally')
}

// Check plugin loading status
setTimeout(() => {
  console.log('🔍 Checking for plugin tabs...')
  
  // Look for plugin tabs in DOM
  const tabElements = document.querySelectorAll('[aria-label="Plugin Tabs"] button')
  console.log(`📊 Found ${tabElements.length} tab elements`)
  
  tabElements.forEach((tab, index) => {
    console.log(`  Tab ${index + 1}: ${tab.textContent}`)
  })
  
  // Check for specific plugin indicators
  const demoTab = document.querySelector('button:contains("Demo")')
  const vehicleMonitorTab = document.querySelector('button:contains("Vehicle Monitor")')
  const myFirstTab = document.querySelector('button:contains("My First Tab")')
  
  if (demoTab || vehicleMonitorTab || myFirstTab) {
    console.log('✅ Plugin tabs found!')
  } else {
    console.log('❌ No plugin tabs found')
  }
}, 2000)