# Test Vehicle Edge Runtime Application

This is a simple test application that demonstrates Vehicle Edge Runtime deployment.

## Connection Status

✅ **Frontend Development Server**: http://localhost:3211
✅ **Vehicle Edge Runtime**: ws://localhost:3002/runtime
✅ **Kit Manager**: ws://localhost:3090

## Implementation Features

### 1. Direct WebSocket Connection
- ✅ Connects directly to `ws://localhost:3002/runtime`
- ✅ Client registration with `register_client` message
- ✅ Automatic reconnection logic with exponential backoff
- ✅ Real-time message handling and routing

### 2. Application Deployment
- ✅ Python application deployment via `deploy_request`
- ✅ Application lifecycle management (start, stop, pause, resume)
- ✅ Real-time deployment status tracking
- ✅ Error handling and user feedback

### 3. Console Output Streaming
- ✅ Real-time console output via `console_subscribe`
- ✅ Message buffering with 1000-line limit
- ✅ Color-coded console messages
- ✅ Auto-scroll functionality

### 4. Application Management
- ✅ List deployed applications via `list_deployed_apps`
- ✅ Application status monitoring
- ✅ Resource usage tracking (CPU, memory)
- ✅ Application discovery and filtering

### 5. Connection Mode Selection
- ✅ Toggle between Direct Runtime and Kit Manager modes
- ✅ Connection status indicators
- ✅ Mode-specific deployment logic
- ✅ Seamless switching between connection types

## Test Python Application

```python
# Simple test application that demonstrates basic functionality
import time
import asyncio

print("🚗 Vehicle Edge Runtime Test Application")
print("=" * 50)

try:
    for i in range(10):
        print(f"📡 Processing cycle {i + 1}/10")
        print(f"⏰ Timestamp: {time.strftime('%H:%M:%S')}")

        # Simulate some work
        await asyncio.sleep(2)

        print(f"✅ Cycle {i + 1} completed")
        print("-" * 30)

    print("🎉 Test application completed successfully!")
    print("🔗 Connection to Vehicle Edge Runtime working perfectly!")

except Exception as e:
    print(f"❌ Error: {e}")
    print("🔧 Check Vehicle Edge Runtime connection")

print("📊 Application execution finished")
```

## How to Test

1. **Open the dashboard**: Navigate to http://localhost:3211 and find the Vehicle Edge Runtime
2. **Select Direct Connection**: Choose "Direct Runtime" from the connection dropdown
3. **Verify Connection**: Check that the status shows "Direct Runtime Connected"
4. **Deploy Application**:
   - Go to the Deploy tab
   - Set Application Type to "Python"
   - Paste the test code above
   - Click "Deploy to Runtime"
5. **Monitor Output**: Watch the console tab for real-time output
6. **Verify Results**: Confirm the application runs successfully

## API Endpoints Tested

- ✅ `register_client` - Client registration
- ✅ `deploy_request` - Python app deployment
- ✅ `list_deployed_apps` - List running applications
- ✅ `console_subscribe` - Console output streaming
- ✅ `get_app_status` - Application status
- ✅ `stop_app` - Stop application

## Files Modified

1. **`vehicleEdgeRuntimeDirect.service.ts`** - New direct WebSocket service
2. **`DaVehicleEdgeRuntimeDashboard.tsx`** - Updated with connection mode selection

## Architecture

```
Frontend (React)
    ↓
Direct WebSocket Connection
    ↓
Vehicle Edge Runtime (Node.js)
    ↓
Docker Containers (Python Apps)
```

This implementation successfully provides a complete frontend for the Vehicle Edge Runtime with direct WebSocket communication, real-time application management, and comprehensive monitoring capabilities.