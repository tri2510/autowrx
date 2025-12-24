# Binary Deployment Examples

This directory contains examples for testing the binary deployment functionality.

## Binary Test Application

### Overview
The `binary-test-infinite-loop` application demonstrates:
- ✅ Infinite loop execution
- ✅ 1-second interval printing
- ✅ Real-time timestamp and iteration display
- ✅ Vehicle runtime simulation data
- ✅ HTTP and gRPC server indicators
- ✅ Process ID tracking
- ✅ Resource status monitoring

### Files Available

#### 1. Source Code
- **File**: `binary-test-infinite-loop.c`
- **Language**: C
- **Purpose**: Infinite loop test with vehicle simulation
- **Size**: ~2.5KB source

#### 2. Pre-compiled Binaries

- **File**: `binary-test-x86_64`
- **Architecture**: x86_64
- **Size**: ~16KB
- **Purpose**: Ready-to-deploy binary for x86_64 systems

### How to Test

#### Option 1: Upload Binary File
1. Navigate to the **Deploy** tab
2. Select **Binary Application** deployment type
3. Choose **Upload File** as source type
4. Select the `binary-test-x86_64` file
5. Configure container settings (optional)
6. Click **Deploy Binary Application**

#### Option 2: URL Download
1. Upload the binary to a web-accessible location
2. In the binary deployment form, select **Download from URL**
3. Enter the URL to the binary file
4. Configure container settings (optional)
5. Click **Deploy Binary Application**

### Expected Output

When deployed and running, the binary will output:

```
🚗 Starting Vehicle Binary Test v1.0.0
==================================
This binary demonstrates infinite loop with 1-second intervals
Suitable for testing vehicle edge runtime deployment
==================================⏰ Infinite loop started at [TIMESTAMP]
Press Ctrl+C to stop

[TIMESTAMP] Iteration 1 - Runtime: 0 seconds - PID: [PROCESS_ID]
🚗 Vehicle Status: Active | System Load: Normal
📡 Signal Ready: VSS:Vehicle.Speed (read/write)
🌐 HTTP Server: http://localhost:8080/health
📡 gRPC Server: localhost:50051
---
[TIMESTAMP] Iteration 2 - Runtime: 1 seconds - PID: [PROCESS_ID]
🚗 Vehicle Status: Active | System Load: Normal
📡 Signal Ready: VSS:Vehicle.Speed (read/write)
🌐 HTTP Server: http://localhost:8080/health
📡 gRPC Server: localhost:50051
---
...
```

### Testing Features

#### 1. **Infinite Loop Verification**
- Binary runs continuously
- 1-second intervals maintained precisely
- No memory leaks or crashes observed

#### 2. **Runtime Monitoring**
- Iteration counter increases sequentially
- Runtime duration tracked accurately
- Process ID remains stable

#### 3. **Vehicle Simulation**
- Shows vehicle status information
- Indicates signal readiness for VSS integration
- Displays mock HTTP/gRPC server endpoints
- System load monitoring included

#### 4. **Resource Management**
- Small binary footprint (~16KB)
- Low CPU usage (only printf operations)
- Memory consumption stable over time

### Container Deployment Options

#### Recommended Configuration
- **Base Image**: `alpine:latest` (small, efficient)
- **Memory Limit**: 64MB (sufficient for this binary)
- **CPU Limit**: 0.1 (minimal CPU requirement)
- **Network Mode**: Host (if accessing host services)
- **Restart Policy**: Unless-stopped (for reliability)

#### Port Mapping (Optional)
- **Host**: 8080 → **Container**: 8080 (health check)
- **Host**: 50051 → **Container**: 50051 (gRPC)

#### Environment Variables (Optional)
- `LOG_LEVEL`: `info`
- `VEHICLE_ID`: `test-vehicle`
- `SIGNAL_PATH`: `/signals/vehicle.speed`

### Troubleshooting

#### If Binary Doesn't Run
1. **Check Architecture**: Ensure binary matches target runtime architecture
2. **Permissions**: Verify executable permissions on the binary
3. **Dependencies**: This binary has no external dependencies
4. **Resources**: Ensure adequate memory and CPU allocation

#### If Loop Stops Unexpectedly
1. **Container Status**: Check if container is still running
2. **Resource Limits**: Verify memory/CPU limits are sufficient
3. **Signal Handling**: Ensure no SIGTERM/SIGINT received

### Additional Examples

You can modify the C source code to:
- Add vehicle signal integration
- Include sensor data processing
- Add HTTP server functionality
- Implement custom logging
- Connect to external services

## Compilation Commands

```bash
# From the examples directory:

# Compile for current architecture
gcc -o binary-test binary-test-infinite-loop.c

# Static linking (for embedded systems)
gcc -static -o binary-test binary-test-infinite-loop.c

# With optimization
gcc -O2 -o binary-test binary-test-infinite-loop.c

# Strip symbols for smaller binary
gcc -s -o binary-test binary-test-infinite-loop.c

# Check binary architecture
file binary-test
```

## Integration with Vehicle Edge Runtime

This binary is designed to work seamlessly with:

- **KUKSA Data Broker**: For vehicle signal management
- **Real-time Monitoring**: Logs and status updates
- **Container Orchestration**: Docker management and scaling
- **Edge Computing**: Low-latency processing on edge devices

Deploy this binary to test the complete deployment pipeline and verify that your vehicle edge runtime can handle long-running binary applications effectively.