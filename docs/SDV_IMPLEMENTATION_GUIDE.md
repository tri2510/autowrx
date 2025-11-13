# SDV Deployment Implementation Guide

## Overview

This guide provides detailed technical specifications for implementing the SDV deployment architecture in AutoWRX. It covers component designs, API specifications, and integration patterns.

## Component Specifications

### 1. SDVDeploymentHub Component

**File**: `frontend/src/components/organisms/SDVDeploymentHub.tsx`

**Purpose**: Main orchestration component that manages the complete deployment workflow.

**Key Features**:
- Step-by-step deployment wizard
- State management for deployment process
- Integration with all deployment components
- Progress tracking and error handling

**Props Interface**:
```typescript
interface SDVDeploymentHubProps {
  pythonCode: string          // Generated Python code from AI
  prototypeName?: string      // Name of the prototype
  isOpen: boolean            // Modal visibility state
  onClose: () => void        // Close handler
}
```

**State Management**:
```typescript
interface DeploymentState {
  currentStep: DeploymentStep
  appPackage: SDVAppPackage | null
  selectedDevices: DeviceInfo[]
  detectedBroker: KuksaBrokerInfo | null
  deploymentResults: DeploymentResult[]
}

type DeploymentStep = 'configure' | 'package' | 'devices' | 'kuksa' | 'deploy' | 'complete'
```

### 2. DaAppPackager Component

**File**: `frontend/src/components/molecules/deployment/DaAppPackager.tsx`

**Purpose**: Creates deployment-ready packages from Python code.

**Package Configuration**:
```typescript
interface SDVAppPackage {
  name: string
  version: string
  description: string
  pythonVersion: string
  entryPoint: string
  runtimeMode: 'docker' | 'native'
  code: string

  kuksaConfig: {
    brokerAutoDetect: boolean
    fallbackBroker: boolean
    vssVersion: string
    customBrokerUrl?: string
  }

  deployment: {
    targetDevices: string[]
    hotSwap: boolean
    otaEnabled: boolean
    resourceLimits: {
      memory: string
      cpu: string
    }
  }

  security: {
    sandboxLevel: 'basic' | 'advanced' | 'military'
    dataAccess: 'open' | 'restricted' | 'encrypted'
    interAppCommunication: boolean
  }
}
```

**Validation Rules**:
- App name: alphanumeric + hyphens only, lowercase
- Version: semantic versioning (x.y.z)
- Python code: syntax validation
- Resource limits: minimum 128MB memory, 0.1 CPU

### 3. DaDeviceScanner Component

**File**: `frontend/src/components/molecules/deployment/DaDeviceScanner.tsx`

**Purpose**: Auto-discovers and manages SDV-compatible devices.

**Device Discovery Algorithm**:
```typescript
class DeviceScanner {
  async scanNetwork(): Promise<DeviceInfo[]> {
    const devices: DeviceInfo[] = []

    // 1. mDNS Discovery
    const mdnsDevices = await this.scanMDNS()
    devices.push(...mdnsDevices)

    // 2. IP Range Scanning
    const ipDevices = await this.scanIPRange('192.168.1.0/24')
    devices.push(...ipDevices)

    // 3. Capability Detection
    const devicesWithCapabilities = await Promise.all(
      devices.map(device => this.detectCapabilities(device))
    )

    return devicesWithCapabilities.filter(device => device.isCompatible)
  }

  private async detectCapabilities(device: DeviceInfo): Promise<DeviceInfo> {
    // Test for Docker
    const hasDocker = await this.testDocker(device.ip)

    // Test for Python
    const hasPython = await this.testPython(device.ip)

    // Test for Kuksa
    const hasKuksa = await this.testKuksa(device.ip)

    // Get system info
    const systemInfo = await this.getSystemInfo(device.ip)

    return {
      ...device,
      runtime: hasDocker ? 'docker' : (hasPython ? 'native' : 'unsupported'),
      capabilities: {
        gpu: systemInfo.gpu,
        kuksa: hasKuksa,
        memory: systemInfo.memory,
        storage: systemInfo.storage
      }
    }
  }
}
```

**Device Information Structure**:
```typescript
interface DeviceInfo {
  id: string
  name: string
  type: 'jetson-orin' | 'linux-generic' | 'automotive-prototype' | 'unknown'
  ip: string
  status: 'online' | 'offline' | 'error'
  runtime: 'docker' | 'native' | 'both'
  architecture: 'arm64' | 'x86_64' | 'unknown'
  capabilities: {
    gpu: boolean
    kuksa: boolean
    memory: string
    storage: string
  }
  lastSeen: string
}
```

### 4. DaKuksaConfig Component

**File**: `frontend/src/components/molecules/deployment/DaKuksaConfig.tsx`

**Purpose**: Configures Kuksa Databroker integration.

**Broker Discovery**:
```typescript
class KuksaDiscovery {
  async scanForBrokers(): Promise<KuksaBrokerInfo[]> {
    const commonPorts = [1883, 8883, 8090, 8091, 9001]
    const commonHosts = ['localhost', '127.0.0.1', '192.168.1.100']

    const brokers: KuksaBrokerInfo[] = []

    for (const host of commonHosts) {
      for (const port of commonPorts) {
        const broker = await this.testBroker(host, port)
        if (broker) {
          brokers.push(broker)
        }
      }
    }

    return brokers
  }

  private async testBroker(host: string, port: number): Promise<KuksaBrokerInfo | null> {
    try {
      // Test MQTT connection
      const client = mqtt.connect(`mqtt://${host}:${port}`)
      await new Promise((resolve, reject) => {
        client.on('connect', resolve)
        client.on('error', reject)
        setTimeout(reject, 5000)
      })

      // Test Kuksa API
      const response = await fetch(`http://${host}:${port}/vss`)
      const vssData = await response.json()

      return {
        host,
        port,
        version: vssData.version || 'unknown',
        status: 'online',
        responseTime: Date.now() - startTime,
        vssVersion: vssData.schema_version
      }
    } catch (error) {
      return null
    }
  }
}
```

### 5. DaDeploymentManager Component

**File**: `frontend/src/components/molecules/deployment/DaDeploymentManager.tsx`

**Purpose**: Orchestrates deployment to multiple devices.

**Deployment Process**:
```typescript
class DeploymentManager {
  async deployToDevices(appPackage: SDVAppPackage, devices: DeviceInfo[]): Promise<DeploymentResult[]> {
    const deploymentPromises = devices.map(device =>
      this.deployToDevice(appPackage, device)
    )

    return Promise.all(deploymentPromises)
  }

  private async deployToDevice(appPackage: SDVAppPackage, device: DeviceInfo): Promise<DeploymentResult> {
    const result: DeploymentResult = {
      deviceId: device.id,
      status: 'pending',
      progress: 0,
      message: `Starting deployment to ${device.name}`
    }

    try {
      // Stage 1: Compatibility Check
      result.progress = 10
      result.message = 'Checking device compatibility...'
      await this.checkCompatibility(appPackage, device)

      // Stage 2: Package Transfer
      result.progress = 30
      result.message = 'Transferring application package...'
      await this.transferPackage(appPackage, device)

      // Stage 3: Installation
      result.progress = 60
      result.message = 'Installing application...'
      await this.installPackage(appPackage, device)

      // Stage 4: Kuksa Integration
      result.progress = 80
      result.message = 'Configuring Kuksa integration...'
      await this.configureKuksa(appPackage, device)

      // Stage 5: Start Application
      result.progress = 90
      result.message = 'Starting application...'
      await this.startApplication(appPackage, device)

      // Stage 6: Health Check
      result.progress = 95
      result.message = 'Performing health check...'
      await this.healthCheck(device)

      result.status = 'success'
      result.progress = 100
      result.message = `Successfully deployed to ${device.name}`

    } catch (error) {
      result.status = 'error'
      result.message = `Deployment failed: ${error.message}`
      result.error = error.message
    }

    return result
  }
}
```

## API Specifications

### 1. Device Discovery API

**Endpoint**: `GET /api/devices/discover`

**Response**:
```json
{
  "devices": [
    {
      "id": "jetson-01",
      "name": "NVIDIA Jetson Orin DevKit",
      "type": "jetson-orin",
      "ip": "192.168.1.100",
      "status": "online",
      "runtime": "docker",
      "architecture": "arm64",
      "capabilities": {
        "gpu": true,
        "kuksa": true,
        "memory": "32GB",
        "storage": "64GB"
      },
      "lastSeen": "2025-01-13T10:30:00Z"
    }
  ]
}
```

### 2. App Packaging API

**Endpoint**: `POST /api/apps/package`

**Request Body**:
```json
{
  "name": "welcome-assistant",
  "version": "1.0.0",
  "description": "Vehicle welcome assistance app",
  "code": "import asyncio\nfrom kuksa_client import KuksaClient\n...",
  "runtimeMode": "docker",
  "kuksaConfig": {
    "brokerAutoDetect": true,
    "fallbackBroker": true,
    "vssVersion": "latest"
  },
  "deployment": {
    "hotSwap": true,
    "otaEnabled": true,
    "resourceLimits": {
      "memory": "512MB",
      "cpu": "0.5"
    }
  }
}
```

**Response**:
```json
{
  "packageId": "pkg_123456789",
  "downloadUrl": "https://autowrx.io/packages/pkg_123456789.tar.gz",
  "checksum": "sha256:abc123...",
  "size": "2.5MB",
  "createdAt": "2025-01-13T10:30:00Z"
}
```

### 3. Deployment API

**Endpoint**: `POST /api/deployments`

**Request Body**:
```json
{
  "packageId": "pkg_123456789",
  "devices": ["jetson-01", "linux-01"],
  "deploymentMode": "hot-swap",
  "rollbackEnabled": true
}
```

**Response**:
```json
{
  "deploymentId": "deploy_123456789",
  "status": "in-progress",
  "devices": [
    {
      "deviceId": "jetson-01",
      "status": "deploying",
      "progress": 45,
      "message": "Installing application..."
    },
    {
      "deviceId": "linux-01",
      "status": "pending",
      "progress": 0,
      "message": "Waiting to start..."
    }
  ]
}
```

### 4. Deployment Status API

**Endpoint**: `GET /api/deployments/{deploymentId}`

**Response**:
```json
{
  "deploymentId": "deploy_123456789",
  "status": "completed",
  "startTime": "2025-01-13T10:30:00Z",
  "endTime": "2025-01-13T10:32:15Z",
  "devices": [
    {
      "deviceId": "jetson-01",
      "status": "success",
      "progress": 100,
      "message": "Application running successfully",
      "startTime": "2025-01-13T10:30:00Z",
      "endTime": "2025-01-13T10:31:30Z"
    },
    {
      "deviceId": "linux-01",
      "status": "success",
      "progress": 100,
      "message": "Application running successfully",
      "startTime": "2025-01-13T10:31:00Z",
      "endTime": "2025-01-13T10:32:15Z"
    }
  ]
}
```

## Device Agent Implementation

### Device Agent Architecture

**File**: `device-agent/device_agent.py`

**Purpose**: Runs on target devices to manage application lifecycle.

```python
import asyncio
import logging
import json
import subprocess
from typing import Dict, List, Optional
from dataclasses import dataclass
import aiohttp
import docker

@dataclass
class AppInstance:
    id: str
    name: str
    version: str
    status: 'stopped' | 'running' | 'error'
    container_id: Optional[str] = None
    pid: Optional[int] = None
    kuksa_endpoint: Optional[str] = None

class DeviceAgent:
    def __init__(self, config: Dict):
        self.config = config
        self.runtime_mode = config.get('runtime_mode', 'docker')
        self.apps: Dict[str, AppInstance] = {}
        self.kuksa_client = None

    async def start(self):
        """Initialize device agent"""
        await self.discover_kuksa_broker()
        await self.start_health_monitor()

    async def discover_kuksa_broker(self):
        """Auto-discover Kuksa Databroker"""
        # Try local broker first
        if await self.test_kuksa_connection('localhost', 1883):
            self.kuksa_endpoint = 'localhost:1883'
            return

        # Scan network for brokers
        brokers = await self.scan_network_for_brokers()
        if brokers:
            self.kuksa_endpoint = brokers[0]
            return

        # Start fallback broker
        await self.start_fallback_broker()

    async def deploy_app(self, package_data: Dict) -> AppInstance:
        """Deploy application to device"""
        app = AppInstance(
            id=package_data['id'],
            name=package_data['name'],
            version=package_data['version'],
            status='stopped'
        )

        try:
            if self.runtime_mode == 'docker':
                await self.deploy_docker_app(app, package_data)
            else:
                await self.deploy_native_app(app, package_data)

            app.status = 'running'
            self.apps[app.id] = app

            return app

        except Exception as e:
            app.status = 'error'
            raise e

    async def deploy_docker_app(self, app: AppInstance, package_data: Dict):
        """Deploy app using Docker"""
        client = docker.from_env()

        # Pull base image if needed
        image_name = f"autowrx/app:{package_data['name']}-{package_data['version']}"

        # Create container
        container = client.containers.run(
            image_name,
            name=f"autowrx-{app.id}",
            detach=True,
            network_mode='host',
            environment={
                'KUKSA_ENDPOINT': self.kuksa_endpoint,
                'VSS_VERSION': package_data['kuksaConfig']['vssVersion']
            },
            mem_limit=package_data['deployment']['resourceLimits']['memory'],
            cpu_quota=int(float(package_data['deployment']['resourceLimits']['cpu']) * 100000)
        )

        app.container_id = container.id

    async def deploy_native_app(self, app: AppInstance, package_data: Dict):
        """Deploy app as native Python process"""
        # Extract package
        extract_path = f"/opt/autowrx/{app.id}"
        subprocess.run(['tar', '-xzf', package_data['package_path'], '-C', extract_path])

        # Start Python process
        cmd = [
            'python3',
            f"{extract_path}/app.py",
            '--kuksa-endpoint', self.kuksa_endpoint,
            '--vss-version', package_data['kuksaConfig']['vssVersion']
        ]

        process = subprocess.Popen(cmd)
        app.pid = process.pid

    async def hot_swap_app(self, app_id: str, new_package_data: Dict):
        """Update running app without downtime"""
        old_app = self.apps.get(app_id)
        if not old_app:
            raise ValueError(f"App {app_id} not found")

        # Deploy new version
        new_app = await self.deploy_app(new_package_data)

        # Wait for new app to be healthy
        await self.wait_for_healthy(new_app.id, timeout=30)

        # Stop old app
        await self.stop_app(old_app.id)

    async def stop_app(self, app_id: str):
        """Stop application"""
        app = self.apps.get(app_id)
        if not app:
            return

        if app.container_id:
            client = docker.from_env()
            container = client.containers.get(app.container_id)
            container.stop()
            container.remove()
        elif app.pid:
            subprocess.run(['kill', str(app.pid)])

        app.status = 'stopped'
```

## Kuksa Integration

### Python App Template Generator

**File**: `templates/python_app_template.py`

```python
# pylint: disable=C0103, C0413, E1101
import asyncio
import logging
import signal
import os
from typing import Dict, Any

from kuksa_client import KuksaClient
from kuksa_client.grpc import VSSClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SDVVehicleApp:
    def __init__(self):
        self.kuksa_client = None
        self.app_config = self.load_app_config()

    def load_app_config(self) -> Dict[str, Any]:
        """Load app configuration from environment or file"""
        config = {
            'kuksa_endpoint': os.getenv('KUKSA_ENDPOINT', 'localhost:1883'),
            'vss_version': os.getenv('VSS_VERSION', 'latest'),
            'app_name': os.getenv('APP_NAME', 'SDV App'),
            'app_version': os.getenv('APP_VERSION', '1.0.0')
        }

        # Try to load from config file
        config_file = '/app/config.json'
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)

        return config

    async def initialize_kuksa(self):
        """Initialize Kuksa client"""
        try:
            self.kuksa_client = KuksaClient(
                broker_address=self.app_config['kuksa_endpoint'],
                vss_version=self.app_config['vss_version']
            )

            await self.kuksa_client.connect()
            logger.info(f"Connected to Kuksa Databroker at {self.app_config['kuksa_endpoint']}")

        except Exception as e:
            logger.error(f"Failed to connect to Kuksa Databroker: {e}")
            # Try to start fallback broker
            await self.start_fallback_broker()

    async def start_fallback_broker(self):
        """Start fallback Kuksa Databroker"""
        logger.info("Starting fallback Kuksa Databroker...")
        # Implementation for starting local broker

    async def subscribe_to_signals(self):
        """Subscribe to vehicle signals"""
        # Override this method in your app
        pass

    async def on_start(self):
        """App startup logic"""
        # Override this method in your app
        pass

    async def on_stop(self):
        """App cleanup logic"""
        # Override this method in your app
        pass

    async def run(self):
        """Main application loop"""
        try:
            await self.initialize_kuksa()
            await self.on_start()
            await self.subscribe_to_signals()

            # Keep running
            while True:
                await asyncio.sleep(1)

        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        except Exception as e:
            logger.error(f"Application error: {e}")
        finally:
            await self.on_stop()
            if self.kuksa_client:
                await self.kuksa_client.disconnect()

# Auto-generated app logic will be inserted here
{{APP_LOGIC}}

async def main():
    app = SDVVehicleApp()
    await app.run()

if __name__ == "__main__":
    signal.signal(signal.SIGTERM, lambda sig, frame: asyncio.create_task(app.on_stop()))
    asyncio.run(main())
```

## Security Implementation

### Sandboxing Configuration

**Docker Security Profile**:
```dockerfile
FROM python:3.9-slim

# Create non-root user
RUN useradd -m -u 1000 autowrx

# Set up app directory
WORKDIR /app

# Copy application
COPY --chown=autowrx:autowrx . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Security settings
RUN chmod -R 755 /app && \
    chmod -R +x /app/scripts/*

# Switch to non-root user
USER autowrx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8080/health')" || exit 1

# Expose only necessary ports
EXPOSE 8080

# Start application
CMD ["python", "app.py"]
```

### Resource Limits

**Docker Compose Configuration**:
```yaml
version: '3.8'
services:
  sdv-app:
    image: autowrx/app:latest
    container_name: autowrx-app
    network_mode: host
    restart: unless-stopped

    # Resource limits
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

    # Security settings
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m

    # Environment variables
    environment:
      - KUKSA_ENDPOINT=${KUKSA_ENDPOINT}
      - VSS_VERSION=${VSS_VERSION}
      - APP_NAME=${APP_NAME}
      - APP_VERSION=${APP_VERSION}

    # Volumes (read-only where possible)
    volumes:
      - ./config:/app/config:ro
      - ./logs:/app/logs
      - app-data:/app/data
```

## Monitoring and Observability

### Health Check Implementation

```python
class HealthChecker:
    def __init__(self, app: SDVVehicleApp):
        self.app = app
        self.health_status = {
            'kuksa_connection': False,
            'app_running': False,
            'last_check': None
        }

    async def start_health_monitor(self):
        """Start periodic health checks"""
        while True:
            await self.check_health()
            await asyncio.sleep(30)  # Check every 30 seconds

    async def check_health(self):
        """Perform health check"""
        try:
            # Check Kuksa connection
            if self.app.kuksa_client:
                await self.app.kuksa_client.ping()
                self.health_status['kuksa_connection'] = True
            else:
                self.health_status['kuksa_connection'] = False

            # Check application-specific health
            await self.check_app_health()
            self.health_status['app_running'] = True

            self.health_status['last_check'] = datetime.utcnow().isoformat()

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            self.health_status['app_running'] = False

    async def get_health_status(self) -> Dict:
        """Return current health status"""
        return self.health_status
```

### Metrics Collection

```python
class MetricsCollector:
    def __init__(self):
        self.metrics = {
            'signal_updates': 0,
            'errors': 0,
            'cpu_usage': 0,
            'memory_usage': 0,
            'kuksa_latency': []
        }

    async def collect_system_metrics(self):
        """Collect system resource metrics"""
        import psutil

        self.metrics['cpu_usage'] = psutil.cpu_percent()
        self.metrics['memory_usage'] = psutil.virtual_memory().percent

    async def track_kuksa_latency(self, operation: str):
        """Track Kuksa operation latency"""
        start_time = time.time()
        try:
            # Perform Kuksa operation
            result = yield
            latency = (time.time() - start_time) * 1000  # Convert to ms
            self.metrics['kuksa_latency'].append({
                'operation': operation,
                'latency_ms': latency,
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            self.metrics['errors'] += 1
            raise
```

## Testing Strategy

### Unit Tests

```python
# tests/test_device_agent.py
import pytest
import asyncio
from unittest.mock import Mock, patch
from device_agent import DeviceAgent, AppInstance

class TestDeviceAgent:
    @pytest.fixture
    def device_agent(self):
        config = {
            'runtime_mode': 'docker',
            'kuksa_endpoint': 'localhost:1883'
        }
        return DeviceAgent(config)

    @pytest.mark.asyncio
    async def test_discover_kuksa_broker_local(self, device_agent):
        """Test discovering local Kuksa broker"""
        with patch('device_agent.test_kuksa_connection', return_value=True):
            await device_agent.discover_kuksa_broker()
            assert device_agent.kuksa_endpoint == 'localhost:1883'

    @pytest.mark.asyncio
    async def test_deploy_docker_app(self, device_agent):
        """Test Docker app deployment"""
        package_data = {
            'id': 'test-app',
            'name': 'Test App',
            'version': '1.0.0',
            'deployment': {
                'resourceLimits': {
                    'memory': '512MB',
                    'cpu': '0.5'
                }
            }
        }

        with patch('docker.from_env') as mock_docker:
            mock_container = Mock()
            mock_client = Mock()
            mock_client.containers.run.return_value = mock_container
            mock_docker.return_value = mock_client

            app = await device_agent.deploy_app(package_data)

            assert app.id == 'test-app'
            assert app.status == 'running'
            assert app.container_id == mock_container.id
```

### Integration Tests

```python
# tests/test_deployment_integration.py
import pytest
import aiohttp
from testing.integration import TestEnvironment

class TestDeploymentIntegration:
    @pytest.fixture
    async def test_env(self):
        env = TestEnvironment()
        await env.start()
        yield env
        await env.stop()

    @pytest.mark.asyncio
    async def test_full_deployment_workflow(self, test_env):
        """Test complete deployment workflow"""

        # 1. Package app
        package_data = {
            'name': 'test-app',
            'version': '1.0.0',
            'code': 'print("Hello SDV!")',
            'runtimeMode': 'docker'
        }

        package_response = await test_env.client.post('/api/apps/package', json=package_data)
        assert package_response.status == 200
        package_info = await package_response.json()

        # 2. Discover devices
        devices_response = await test_env.client.get('/api/devices/discover')
        assert devices_response.status == 200
        devices = await devices_response.json()
        assert len(devices['devices']) > 0

        # 3. Deploy to device
        deployment_data = {
            'packageId': package_info['packageId'],
            'devices': [devices['devices'][0]['id']]
        }

        deployment_response = await test_env.client.post('/api/deployments', json=deployment_data)
        assert deployment_response.status == 200
        deployment = await deployment_response.json()

        # 4. Monitor deployment
        deployment_id = deployment['deploymentId']

        for _ in range(30):  # Wait up to 30 seconds
            status_response = await test_env.client.get(f'/api/deployments/{deployment_id}')
            status = await status_response.json()

            if status['status'] == 'completed':
                break

            await asyncio.sleep(1)
        else:
            pytest.fail("Deployment did not complete in time")

        # 5. Verify app is running
        device_id = devices['devices'][0]['id']
        app_status = await test_env.get_device_app_status(device_id, package_info['packageId'])
        assert app_status['status'] == 'running'
```

## Performance Considerations

### Deployment Optimization

1. **Parallel Deployment**: Deploy to multiple devices simultaneously
2. **Incremental Updates**: Only transfer changed files
3. **Compression**: Compress packages before transfer
4. **Caching**: Cache base images and dependencies

### Resource Management

1. **Memory Limits**: Enforce per-app memory constraints
2. **CPU Throttling**: Prevent apps from consuming excessive CPU
3. **Network Isolation**: Limit network access to Kuksa broker only
4. **Disk Quotas**: Limit per-app disk usage

### Scaling Considerations

1. **Load Balancing**: Distribute deployments across multiple management nodes
2. **Database Optimization**: Use efficient storage for deployment metadata
3. **WebSocket Scaling**: Handle real-time updates for many deployments
4. **Caching Strategy**: Cache device capabilities and status information

## Troubleshooting Guide

### Common Issues

1. **Device Discovery Fails**
   - Check network connectivity
   - Verify firewall settings
   - Ensure device agent is running

2. **Kuksa Connection Issues**
   - Verify broker is running
   - Check network ports (1883, 8883)
   - Test with fallback broker

3. **Deployment Failures**
   - Check device compatibility
   - Verify resource limits
   - Review app logs for errors

4. **Hot Swap Issues**
   - Ensure app supports graceful shutdown
   - Check health check implementation
   - Verify state transfer logic

### Debugging Tools

1. **Device Agent Logs**: `/var/log/autowrx/device-agent.log`
2. **App Logs**: `/var/log/autowrx/apps/{app_id}.log`
3. **Kuksa Logs**: `/var/log/kuksa/kuksa.log`
4. **System Metrics**: Available via `/api/devices/{device_id}/metrics`

This implementation guide provides the technical foundation for building the SDV deployment architecture in AutoWRX. The modular design allows for incremental implementation and testing of each component while maintaining the overall system integration.