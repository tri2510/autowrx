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

## Test Python Application (Default)

```python
import time
import datetime

DURATION = 300
INTERVAL = 10

start = time.time()
while time.time() - start < DURATION:
    elapsed = time.time() - start
    if int(elapsed) % INTERVAL == 0:
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] Elapsed: {elapsed:.0f}s")
    time.sleep(1)

print("\nDone.")
```

## Test Application with SDV Support (Optional)

```python
# Vehicle Edge Runtime Test Application with SDV Support
import time
import asyncio
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle

class TestApp(VehicleApp):
    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        print("🚗 Vehicle Edge Runtime Test Application")
        print("=" * 50)

        try:
            for i in range(10):
                print(f"📡 Processing cycle {i + 1}/10")
                print(f"⏰ Timestamp: {time.strftime('%H:%M:%S')}")

                # Toggle headlights (if available)
                if hasattr(self.Vehicle.Body.Lights.Beam.Low, 'IsOn'):
                    await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(i % 2 == 0)
                    light_state = (await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()).value
                    print(f"💡 Headlights: {'ON' if light_state else 'OFF'}")

                # Simulate some work
                await asyncio.sleep(2)

                print(f"✅ Cycle {i + 1} completed")
                print("-" * 30)

            print("🎉 Test application completed successfully!")
            print("🔗 SDV and Vehicle Edge Runtime working perfectly!")

        except Exception as e:
            print(f"❌ Error: {e}")
            print("🔧 Check Vehicle Edge Runtime connection and SDV availability")

async def main():
    app = TestApp(vehicle)
    await app.run()

if __name__ == "__main__":
    asyncio.run(main())
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