# SDV Device Contract Specification

## Overview

This document defines the contract and requirements for devices to be compatible with the AutoWRX SDV deployment system. It specifies the technical standards, APIs, protocols, and capabilities that devices must implement to support seamless, abstract deployment of Python vehicle applications.

## Device Classification

### Supported Device Types

1. **Edge AI Devices** (Primary)
   - NVIDIA Jetson Orin (Nano, AGX, DevKit)
   - NVIDIA Jetson Xavier NX, AGX
   - Google Coral Dev Board
   - Raspberry Pi 4/5 (with AI accelerator)

2. **Generic Linux Systems**
   - Ubuntu 20.04+ / Debian 11+
   - CentOS/RHEL 8+
   - Arch Linux
   - Custom Linux distributions

3. **Automotive Development Boards**
   - Renesas R-Car V3H/V3U
   - NXP i.MX 8系列
   - Qualcomm Snapdragon Automotive SoCs
   - Intel Automotive SoCs

4. **Future/Custom Devices**
   - Custom automotive ECUs
   - Development prototypes
   - Cloud instances (for simulation)

## Core Requirements

### 1. Operating System Requirements

#### Base OS Requirements
```yaml
minimum_requirements:
  os: "Linux (kernel 4.15+)"
  architecture: "x86_64 or ARM64"
  memory: "Minimum 2GB RAM (4GB+ recommended)"
  storage: "Minimum 8GB storage (32GB+ recommended)"
  networking: "Ethernet or WiFi connectivity"

recommended_requirements:
  os: "Ubuntu 20.04 LTS or newer"
  memory: "8GB+ RAM"
  storage: "64GB+ SSD"
  networking: "Gigabit Ethernet preferred"
```

#### Required System Packages
```bash
# Base system packages
sudo apt update
sudo apt install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    systemd \
    docker.io \
    docker-compose \
    network-manager \
    avahi-daemon
```

### 2. Runtime Environment Requirements

#### Python Runtime Support
```yaml
python_requirements:
  version: "Python 3.9+"
  package_manager: "pip3"
  virtual_environment: "venv or conda"

required_packages:
  - "aiohttp>=3.8.0"
  - "asyncio-mqtt>=0.13.0"
  - "protobuf>=4.0.0"
  - "opentelemetry-api>=1.20.0"
  - "psutil>=5.8.0"
  - "websockets>=10.0"
```

#### Container Runtime Support (Optional but Recommended)
```yaml
docker_requirements:
  docker_version: "20.10+"
  docker_compose_version: "1.29+"
  container_runtime: "docker or podman"

features:
  - "Container networking (host mode)"
  - "Volume mounting"
  - "Resource limits (CPU, memory)"
  - "Health checks"
  - "Restart policies"
```

## 3. Device Agent Requirements

### Device Agent Contract
Every compatible device must run the AutoWRX Device Agent that implements the following interface:

#### Agent API Specification
```typescript
interface DeviceAgent {
  // Discovery and Registration
  registerDevice(deviceInfo: DeviceInfo): Promise<RegistrationResult>
  heartbeat(): Promise<HeartbeatResponse>
  getCapabilities(): Promise<DeviceCapabilities>

  // Application Lifecycle Management
  deployApplication(packageInfo: PackageInfo): Promise<DeploymentResult>
  startApplication(appId: string): Promise<StartResult>
  stopApplication(appId: string): Promise<StopResult>
  restartApplication(appId: string): Promise<RestartResult>
  removeApplication(appId: string): Promise<RemoveResult>

  // Application Management
  listApplications(): Promise<ApplicationList>
  getApplicationStatus(appId: string): Promise<ApplicationStatus>
  getApplicationLogs(appId: string, options?: LogOptions): Promise<LogStream>

  // Resource Management
  getSystemMetrics(): Promise<SystemMetrics>
  getResourceUsage(appId: string): Promise<ResourceUsage>

  // Configuration Management
  updateConfiguration(config: DeviceConfig): Promise<ConfigResult>
  getConfiguration(): Promise<DeviceConfig>
}
```

#### Device Agent Communication Protocol
```yaml
communication_protocol:
  transport: "HTTP/HTTPS and WebSocket"
  port: 8080 (configurable)
  authentication: "JWT tokens or API keys"

endpoints:
  discovery:
    method: "GET"
    path: "/api/v1/device/info"
    response: DeviceInfo

  deployment:
    method: "POST"
    path: "/api/v1/deployments"
    request: DeploymentRequest
    response: DeploymentResponse

  lifecycle:
    start: "POST /api/v1/apps/{id}/start"
    stop: "POST /api/v1/apps/{id}/stop"
    restart: "POST /api/v1/apps/{id}/restart"
    status: "GET /api/v1/apps/{id}/status"

  monitoring:
    metrics: "GET /api/v1/metrics"
    health: "GET /api/v1/health"
    logs: "WebSocket /api/v1/logs/{app_id}"
```

### 4. Vehicle Communication Interface

#### Kuksa Databroker Support
Devices must support integration with Kuksa VSS (Vehicle Signal Specification) databroker:

```yaml
kuksa_requirements:
  vss_version: "4.0+ (with 5.0 support preferred)"
  communication_protocol: "MQTT over TCP/IP"

broker_connectivity:
  auto_discovery:
    protocol: "mDNS"
    service_name: "_kuksa._tcp.local"
    port_range: "1883, 8883, 8090, 8091, 9001"

  fallback_support:
    required: true
    implementation: "Built-in Kuksa Databroker starter"

  configuration:
    vss_data_model: "JSON VSS specification"
    access_control: "Signal-level permissions"
    data_types: "All standard VSS data types"
```

#### VSS Signal Interface
```typescript
interface VSS_Interface {
  // Signal Subscription
  subscribe(signalPath: string, callback: SignalCallback): Promise<string>
  unsubscribe(subscriptionId: string): Promise<void>

  // Signal Access
  getSignal(signalPath: string): Promise<SignalValue>
  setSignal(signalPath: string, value: SignalValue): Promise<void>

  // Signal Metadata
  getSignalMetadata(signalPath: string): Promise<SignalMetadata>

  // VSS Tree Access
  getVSSTree(): Promise<VSSTree>
  validateSignalPath(signalPath: string): Promise<ValidationResult>
}
```

## 5. Network and Security Requirements

### Network Configuration
```yaml
network_requirements:
  connectivity:
    - "TCP/IP networking"
    - "mDNS service discovery"
    - "DHCP or static IP configuration"

  protocols:
    - "HTTP/HTTPS (port 8080)"
    - "WebSocket (port 8081)"
    - "MQTT (ports 1883, 8883)"
    - "mDNS (port 5353)"

  firewall:
    required_ports:
      - 8080/tcp  # Device agent HTTP API
      - 8081/tcp  # WebSocket connections
      - 1883/tcp  # Kuksa MQTT
      - 5353/udp  # mDNS
```

### Security Requirements
```yaml
security_requirements:
  authentication:
    method: "JWT tokens or API keys"
    token_validation: "RS256 signature verification"
    token_refresh: "Automatic token refresh"

  authorization:
    role_based_access: true
    signal_level_permissions: true
    device_registration_auth: true

  encryption:
    in_transit: "TLS 1.3 for HTTP/HTTPS"
    mqtt_encryption: "TLS over MQTT"
    local_storage: "Encrypted at rest"

  sandboxing:
    app_isolation: "Required"
    resource_limits: "Enforced"
    network_isolation: "Default deny, Kuksa allow"
```

## 6. Hardware Interface Requirements

### Automotive Interfaces (For Automotive Devices)
```yaml
automotive_interfaces:
  can_bus:
    required: false
    preferred: "SocketCAN with can-utils"
    interfaces: ["can0", "can1"]

  automotive_ethernet:
    required: false
    preferred: "Automotive Ethernet (100BASE-T1, 1000BASE-T1)"

  diagnostics:
    required: false
    protocols: ["OBD-II", "UDS", "DoIP"]

  gpio:
    required: false
    preferred: "Linux GPIO sysfs"
```

### GPU Support (For AI Devices)
```yaml
gpu_requirements:
  nvidia:
    driver: "NVIDIA driver 470+"
    cuda: "CUDA 11.4+"
    tensorrt: "TensorRT 8.0+ (optional)"

  general:
    opencl: "OpenCL 1.2+ (optional)"
    vulkan: "Vulkan 1.2+ (optional)"
```

## 7. Device Information Contract

### Device Information Schema
```typescript
interface DeviceInfo {
  // Basic Information
  id: string                    // Unique device identifier
  name: string                  // Human-readable device name
  type: string                  // Device type classification
  manufacturer: string          // Device manufacturer
  model: string                 // Device model
  version: string               // Firmware/software version

  // Capabilities
  capabilities: {
    runtime: RuntimeCapabilities
    resources: ResourceCapabilities
    interfaces: InterfaceCapabilities
    automotive: AutomotiveCapabilities
  }

  // Network Information
  network: {
    ip_address: string
    mac_address: string
    hostname: string
    interfaces: NetworkInterface[]
  }

  // Status
  status: {
    state: 'online' | 'offline' | 'error' | 'maintenance'
    last_seen: string
    uptime_seconds: number
    agent_version: string
  }

  // Ownership and Access
  ownership: {
    owner_id: string
    organization: string
    access_level: 'owner' | 'admin' | 'user' | 'viewer'
    shared_with: string[]
  }
}
```

### Runtime Capabilities
```typescript
interface RuntimeCapabilities {
  supported_runtimes: Runtime[]
  preferred_runtime: Runtime

  python: {
    versions: string[]
    package_manager: 'pip' | 'conda' | 'poetry'
    virtual_env_support: boolean
  }

  containerization: {
    docker: boolean
    docker_version: string
    compose_version: string
    swarm_support: boolean
  }

  native_execution: {
    process_isolation: boolean
    user_namespace: boolean
    cgroup_support: boolean
  }
}
```

## 8. Application Package Contract

### Package Format Specification
```yaml
package_format: "tar.gz with manifest.json"

package_structure:
  manifest.json:              # Package metadata
  app.py:                     # Main application entry point
  requirements.txt:           # Python dependencies
  config/                     # Configuration files
    app_config.json
    kuksa_config.json
  scripts/                    # Setup and management scripts
    install.sh
    start.sh
    stop.sh
  assets/                     # Static assets and resources
```

### Package Manifest Schema
```typescript
interface PackageManifest {
  // Package Information
  package_id: string
  name: string
  version: string
  description: string
  author: string
  created_at: string

  // Application Configuration
  application: {
    entry_point: string        // Main Python file
    runtime_mode: 'docker' | 'native' | 'hybrid'
    startup_timeout: number     // Startup timeout in seconds
    health_check_interval: number

    // Dependencies
    python_version: string
    system_packages: string[]
    python_packages: Record<string, string>
  }

  // Deployment Configuration
  deployment: {
    target_devices: string[]
    resource_requirements: ResourceRequirements
    environment_variables: Record<string, string>

    # Kuksa Integration
    kuksa: {
      vss_version: string
      required_signals: string[]
      signal_permissions: SignalPermission[]
      fallback_broker: boolean
    }
  }

  // Security Configuration
  security: {
    sandbox_level: 'basic' | 'enhanced' | 'military'
    network_access: 'kuksa-only' | 'restricted' | 'full'
    data_access: 'read' | 'read-write' | 'admin'
    required_permissions: string[]
  }

  // Compatibility
  compatibility: {
    minimum_agent_version: string
    supported_platforms: Platform[]
    excluded_platforms: Platform[]
    dependencies: PackageDependency[]
  }
}
```

## 9. Monitoring and Telemetry

### Required Metrics
```yaml
monitoring_metrics:
  system_metrics:
    - "CPU usage percentage"
    - "Memory usage (used/total)"
    - "Disk usage (used/total)"
    - "Network I/O (bytes in/out)"
    - "System uptime"

  application_metrics:
    - "Application status (running/stopped/error)"
    - "Process ID and resource usage"
    - "Health check results"
    - "Error count and types"
    - "Kuksa connection status"

  deployment_metrics:
    - "Deployment success rate"
    - "Deployment time"
    "Application restart count"
    "Rollback events"
```

### Health Check Contract
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string

  checks: {
    agent_service: HealthCheck
    kuksa_connection: HealthCheck
    system_resources: HealthCheck
    network_connectivity: HealthCheck
  }

  metrics: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    active_applications: number
  }

  issues: HealthIssue[]
}
```

## 10. Device Certification Process

### Certification Levels

#### Level 1: Basic Compatibility
```yaml
requirements:
  - Linux OS with required packages
  - Device agent installation
  - HTTP API endpoint (port 8080)
  - Basic application deployment
  - Kuksa fallback broker support

testing:
  - Device registration test
  - Basic deployment test
  - API connectivity test
  - Resource limit enforcement test
```

#### Level 2: Production Ready
```yaml
requirements:
  - All Level 1 requirements
  - Docker containerization support
  - mDNS service discovery
  - Resource monitoring
  - Health check implementation
  - Security hardening
  - Hot-swapping support

testing:
  - Container deployment test
  - Resource monitoring test
  - Security audit
  - Performance benchmarking
  - Failover testing
```

#### Level 3: Automotive Grade
```yaml
requirements:
  - All Level 2 requirements
  - Automotive hardware interfaces
  - Real-time performance guarantees
  - CAN bus integration
  - Automotive safety compliance
  - OTA update support
  - Fleet management integration

testing:
  - Automotive interface testing
  - Real-time performance testing
  - Safety compliance verification
  - Large-scale deployment testing
  - OTA update testing
```

## 11. Implementation Timeline

### Phase 1: Core Requirements (Immediate)
- [ ] Linux OS compatibility
- [ ] Device agent implementation
- [ ] Basic HTTP API
- [ ] Python runtime support
- [ ] Kuksa fallback broker

### Phase 2: Enhanced Features (3 months)
- [ ] Docker containerization
- [ ] mDNS discovery
- [ ] Resource monitoring
- [ ] Security hardening
- [ ] Health checks

### Phase 3: Automotive Integration (6 months)
- [ ] CAN bus interfaces
- [ ] Real-time optimizations
- [ ] OTA updates
- [ ] Fleet management
- [ ] Automotive safety compliance

## 12. Testing Framework

### Device Certification Tests
```typescript
interface DeviceTestSuite {
  // Basic Functionality Tests
  testDeviceRegistration(): Promise<TestResult>
  testAPIServices(): Promise<TestResult>
  testApplicationDeployment(): Promise<TestResult>
  testResourceManagement(): Promise<TestResult>

  // Integration Tests
  testKuksaIntegration(): Promise<TestResult>
  testContainerDeployment(): Promise<TestResult>
  testNetworkDiscovery(): Promise<TestResult>

  // Performance Tests
  testDeploymentSpeed(): Promise<TestResult>
  testResourceUsage(): Promise<TestResult>
  testScalability(): Promise<TestResult>

  // Security Tests
  testAuthentication(): Promise<TestResult>
  testAuthorization(): Promise<TestResult>
  testNetworkSecurity(): Promise<TestResult>
  testDataIsolation(): Promise<TestResult>
}
```

## 13. Device Registration Process

### Onboarding Workflow
```yaml
registration_steps:
  1. "Device discovery and identification"
  2. "Capability assessment"
  3. "Security validation"
  4. "Agent installation"
  5. "Configuration setup"
  6. "Connectivity testing"
  7. "Application deployment test"
  8. "Certification issuance"

automatic_registration:
  - "mDNS service discovery"
  - "Automatic capability detection"
  - "Self-configuration"
  - "Health check validation"
```

### Device Registration API
```typescript
interface DeviceRegistration {
  // Initial Registration
  registerDevice(deviceInfo: DeviceInfo): Promise<RegistrationResponse>

  // Capability Reporting
  reportCapabilities(capabilities: DeviceCapabilities): Promise<void>

  // Health Monitoring
  updateHealthStatus(status: HealthStatus): Promise<void>

  // Configuration Updates
  updateConfiguration(config: DeviceConfig): Promise<void>
}
```

## 14. Compliance and Standards

### Industry Standards
- **VSS**: Vehicle Signal Specification compliance
- **AUTOSAR**: Automotive Open System Architecture (optional)
- **ISO 26262**: Functional Safety (for automotive devices)
- **ISO 21434**: Cybersecurity Engineering (recommended)
- **UNECE WP.29**: Vehicle cybersecurity (recommended)

### Open Source Standards
- **Linux Foundation**: Automotive Grade Linux
- **Eclipse SDV**: Software Defined Vehicle
- **COVESA**: Connected Vehicle Systems
- **Eclipse Kuksa**: Vehicle Databroker

## Conclusion

This device contract specification ensures that any device implementing these requirements can seamlessly integrate with the AutoWRX SDV deployment system. The contract provides:

1. **Clear Technical Requirements**: Specific APIs, protocols, and capabilities
2. **Scalable Architecture**: Support for diverse device types and capabilities
3. **Future-Proof Design**: Extensible framework for emerging automotive technologies
4. **Certification Process**: Clear path for device validation and approval
5. **Developer-Friendly**: Easy integration and maintenance

Devices that implement this contract will be able to receive Python vehicle applications from the AutoWRX web IDE and run them in a secure, monitored, and managed environment with automatic vehicle communication through Kuksa VSS databroker integration.