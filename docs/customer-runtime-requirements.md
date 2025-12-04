# Customer Runtime Integration Requirements

## Overview
This document defines requirements for integrating third-party customer runtime environments with the Eclipse Autowrx platform, replacing the standard SDV-Runtime component while maintaining full frontend compatibility.

## 1. System Architecture Requirements

### 1.1 Component Replacement
- **Requirement**: Customer runtime must replace SDV-Runtime component without affecting other system components
- **Scope**: Customer runtime handles Python/Rust/C++ app execution and vehicle signal management
- **Compatibility**: Must maintain existing WebSocket protocol interface with Kit-Manager

### 1.2 Communication Architecture
```
Frontend → Kit-Manager → Customer Runtime → Customer Vehicle System
```

## 2. Protocol Compatibility Requirements

### 2.1 WebSocket Protocol Implementation
**Must implement exact same WebSocket protocol as current SDV-Runtime:**

#### 2.1.1 Required Commands
- `register_kit` - Runtime registration
- `register_client` - Client registration
- `messageToKit` - Command routing
- `messageToKit-kitReply` - Response handling
- `list-all-kits` - Runtime discovery
- `broadcastToClient` - Event broadcasting

#### 2.1.2 Code Execution Commands
- `run_python_app` - Python app execution
- `run_rust_app` - Rust app execution
- `run_cpp_app` - C++ app execution
- `run_bin_app` - Binary execution
- `stop_python_app` - App termination

#### 2.1.3 Vehicle Signal Commands
- `subscribe_apis` - Signal subscription
- `write_signals_value` - Signal writing
- `apis-value` - Real-time signal updates
- `set_vars_value` / `trace_vars` - Variable management

#### 2.1.4 Vehicle Model Commands
- `generate_vehicle_model` - VSS model generation
- `revert_vehicle_model` - Model reset

#### 2.1.5 Mock Data Commands
- `list_mock_signal` - Mock signal listing
- `set_mock_signals` - Mock signal configuration

#### 2.1.6 Package Management Commands
- `list_python_packages` - Package listing
- `install_python_packages` - Package installation

#### 2.1.7 Runtime Information Commands
- `get-runtime-info` - Runtime status
- `report-runtime-state` - State reporting

### 2.2 Message Format Requirements
All WebSocket messages must follow existing JSON format:
```json
{
    "cmd": "command_name",
    "to_kit_id": "runtime_identifier",
    "data": { /* command-specific payload */ }
}
```

## 3. Vehicle Signal Integration Requirements

### 3.1 Custom VSS Support
**Requirement**: Customer must support custom VSS (Vehicle Signal Specification) format without requiring Kuksa server**

#### 3.1.1 Signal Mapping Requirements
- **Input**: Standard VSS signal names from frontend
- **Output**: Customer's proprietary signal format
- **Bidirectional**: Must support both reading and writing signals

#### 3.1.2 Signal Format Flexibility
- Must support customer's proprietary signal naming conventions
- Must support customer's data type formats
- Must support customer's signal tree structure

### 3.2 Signal Integration Patterns
**Customer must provide integration methods for:**

#### 3.2.1 Direct Hardware Integration
- CAN bus interfaces
- Automotive ethernet
- Serial communication protocols
- Custom hardware interfaces

#### 3.2.2 Custom Vehicle Systems
- Proprietary vehicle networks
- Custom communication protocols (non-MQTT)
- Customer vehicle data servers
- Third-party vehicle APIs

#### 3.2.3 Simulation/Testing Integration
- Custom simulation environments
- Test bench integration
- HIL (Hardware-in-Loop) systems

## 4. Application Execution Requirements

### 4.1 Language Support
**Must support execution of:**
- Python applications (with custom runtime environment)
- Rust applications (with customer compilation toolchain)
- C++ applications (with customer build system)
- Pre-compiled binaries

### 4.2 Runtime Environment Requirements
- **Isolation**: Each app must execute in isolated environment
- **Resource Management**: Must manage CPU, memory, and I/O resources
- **Security**: Must prevent apps from accessing unauthorized resources
- **Logging**: Must provide execution logs and error reporting

### 4.3 Vehicle SDK Integration
**Customer must provide:**
- Vehicle data access APIs for running applications
- Signal subscription mechanisms
- Actuator control interfaces
- Error handling and status reporting

## 5. Discovery and Registration Requirements

### 5.1 Runtime Discovery
**Customer runtime must:**
- Register with Kit-Manager using standard protocol
- Advertise supported capabilities and features
- Provide runtime status and health information
- Support dynamic runtime registration/deregistration

### 5.2 Capability Advertisement
**Must expose:**
- Supported programming languages
- Available vehicle signals (custom VSS tree)
- Runtime resource limits
- Special features and capabilities
- Custom protocol information

## 6. Frontend Compatibility Requirements

### 6.1 Zero Frontend Changes
**Requirement**: Customer runtime integration must require zero changes to existing frontend**
- All existing frontend functionality must work unchanged
- WebSocket connection handling must be transparent
- API responses must match existing formats

### 6.2 Backward Compatibility
**Must support:**
- Existing prototype applications
- Current dashboard configurations
- Existing signal subscriptions
- Current deployment workflows

## 7. Deployment and Configuration Requirements

### 7.1 Runtime Configuration
**Must support:**
- Custom runtime identifiers and naming
- Flexible VSS signal mapping configuration
- Runtime-specific feature flags
- Customer authentication and authorization

### 7.2 Multi-Runtime Support
**Must enable:**
- Multiple customer runtimes simultaneously
- Runtime isolation and resource separation
- Load balancing across runtimes
- Runtime failover and redundancy

### 7.3 Environment Variables
**Must support configuration via:**
- `RUNTIME_NAME` - Unique runtime identifier
- `RUNTIME_PREFIX` - Runtime naming prefix
- `SYNCER_SERVER_URL` - Kit-Manager connection URL
- `CUSTOM_VSS_CONFIG` - Customer VSS configuration
- `VEHICLE_INTERFACE_CONFIG` - Vehicle integration settings

## 8. Performance and Reliability Requirements

### 8.1 Performance Requirements
- **Response Time**: WebSocket command response < 100ms
- **Signal Updates**: Real-time signal latency < 50ms
- **App Execution**: App startup time < 5 seconds
- **Concurrent Apps**: Support minimum 5 concurrent applications

### 8.2 Reliability Requirements
- **Uptime**: 99.9% availability during operation
- **Error Recovery**: Automatic recovery from failures
- **Connection Stability**: Maintain WebSocket connections
- **Data Integrity**: Ensure signal data accuracy

### 8.3 Monitoring Requirements
**Must provide:**
- Runtime health status reporting
- Resource utilization monitoring
- Application execution tracking
- Error logging and reporting

## 9. Security Requirements

### 9.1 Authentication
- Must support Kit-Manager authentication
- Must validate client connections
- Must support token-based authorization

### 9.2 Application Sandboxing
- Isolate running applications from system resources
- Prevent unauthorized vehicle signal access
- Control file system and network access

### 9.3 Data Protection
- Encrypt sensitive vehicle data
- Secure WebSocket communications
- Protect against unauthorized access

## 10. Integration and Testing Requirements

### 10.1 Integration Testing
- Must pass compatibility tests with existing frontend
- Must handle all standard WebSocket commands
- Must support existing prototype applications
- Must demonstrate signal mapping functionality

### 10.2 Documentation Requirements
**Customer must provide:**
- Signal mapping documentation
- Integration setup instructions
- Configuration parameter reference
- Troubleshooting guide
- API documentation for custom features

### 10.3 Validation Requirements
- Functional testing with prototype applications
- Performance benchmarking
- Security vulnerability assessment
- Compatibility matrix with existing features

## 11. Success Criteria

### 11.1 Functional Success
✅ Frontend applications work unchanged with customer runtime
✅ All WebSocket commands implemented correctly
✅ Custom VSS signals integrated properly
✅ Python/Rust/C++ applications execute successfully

### 11.2 Technical Success
✅ Zero frontend code changes required
✅ Maintains existing performance characteristics
✅ Supports all existing features and workflows
✅ Provides stable and reliable operation

### 11.3 Business Success
✅ Customer can use their proprietary vehicle systems
✅ Enables customer to develop custom vehicle applications
✅ Maintains compatibility with existing prototype ecosystem
✅ Provides clear upgrade and migration path