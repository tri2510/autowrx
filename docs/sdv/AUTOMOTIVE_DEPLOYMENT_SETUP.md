# Automotive-Grade Deployment Setup Guide
## Zero-Touch, Automated Deployment for Automotive Devices

## Overview

This guide provides a comprehensive framework for setting up automotive-grade devices with new OS installations to seamlessly integrate with the AutoWRX SDV deployment system. The solution emphasizes zero-touch deployment, automated configuration, and manufacturing-scale deployment suitable for automotive production environments.

## Target Scenarios

### 1. Manufacturing Line Deployment
- Flash OS image directly during device manufacturing
- Automatic device agent installation and configuration
- Pre-configuration for specific automotive applications
- Quality assurance integration

### 2. Fleet Deployment (In-Field Updates)
- Remote OS installation and configuration
- Automated device onboarding
- Bulk device management capabilities
- Over-the-air (OTA) update support

### 3. Development & Prototyping
- Quick setup for development devices
- Automated configuration scripts
- Development environment provisioning
- Integration with CI/CD pipelines

## Automotive-Grade Architecture

### Deployment Pipeline Overview
```
┌─────────────────────────────────────────────────────────────────────┐
│                    MANUFACTURING PIPELINE                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   OS Image      │  │  Device Agent   │  │   Application   │    │
│  │   Builder       │  │   Installer     │  │   Packages      │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ Pre-configured Image
┌─────────────────────▼───────────────────────────────────────────────┐
│                    DEVICE BOOTSTRAP                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   First Boot     │  │  Auto-Discovery │  │   Configuration  │    │
│  │   Sequence       │  │   & Registration│  │   Sync           │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ Ready for Deployment
┌─────────────────────▼───────────────────────────────────────────────┐
│                    AUTO-WRX DEPLOYMENT HUB                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   Application   │  │   Device        │  │   Monitoring    │    │
│  │   Deployment    │  │   Management     │  │   & Analytics    │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 1. OS Image Creation Strategy

### 1.1 Base OS Customization

#### Supported OS Distributions
```yaml
primary_os:
  ubuntu:
    version: "22.04 LTS Automotive"
    kernel: "5.15+ with PREEMPT_RT patches"
    advantages: "Community support, extensive documentation"
    use_case: "Development, prototyping, general automotive"

  yocto:
    version: "4.2+"
    kernel: "Custom automotive kernel"
    advantages: "Minimal footprint, automotive-specific features"
    use_case: "Production ECUs, embedded systems"

  debian:
    version: "12 (Bookworm)"
    kernel: "6.1+ LTS"
    advantages: "Stability, long-term support"
    use_case: "In-vehicle systems, fleet deployments"

  custom_linux:
    base: "Buildroot or OpenWrt"
    kernel: "5.15+ with automotive patches"
    advantages: "Minimal footprint, fast boot, embedded-optimized"
    use_case: "Production ECUs, resource-constrained devices"
```

#### Custom OS Build Configuration
```bash
#!/bin/bash
# build-automotive-os.sh

# OS Configuration
OS_NAME="autowrx-automotive"
OS_VERSION="1.0"
BASE_OS="ubuntu:22.04"
KERNEL_VERSION="5.15.0-88-generic"

# Create custom base image
docker build -t ${OS_NAME}:${OS_VERSION} - << 'EOF'
FROM ${BASE_OS}

# Automotive-specific kernel configurations
RUN echo "CONFIG_PREEMPT_RT=y" >> /usr/src/linux/.config
RUN echo "CONFIG_CAN=y" >> /usr/src/linux/.config
RUN echo "CONFIG_CAN_J1939=y" >> /usr/src/linux/.config
RUN echo "CONFIG_CAN_RAW=y" >> /usr/src/linux/.config

# Install automotive packages
RUN apt-get update && apt-get install -y \
    linux-image-${KERNEL_VERSION} \
    linux-headers-${KERNEL_VERSION} \
    can-utils \
    vcan \
    python3.9 \
    python3-pip \
    docker.io \
    systemd \
    avahi-daemon \
    network-manager \
    && rm -rf /var/lib/apt/lists/*

# Install AutoWRX Device Agent
RUN mkdir -p /opt/autowrx
COPY device-agent/ /opt/autowrx/
RUN cd /opt/autowrx && pip3 install -r requirements.txt
RUN useradd -m -r autowrx && chown -R autowrx:autowrx /opt/autowrx

# Configure systemd services
COPY systemd/ /etc/systemd/system/
RUN systemctl enable autowrx-agent.service
RUN systemctl enable autowrx-discovery.service
RUN systemctl enable autowrx-monitor.service

# Configure network
COPY network/ /etc/netplan/
RUN netplan generate

# Security hardening
COPY security/ /etc/security/
RUN chmod 600 /etc/security/*.*
RUN sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# First boot configuration
COPY firstboot/ /opt/firstboot/
RUN chmod +x /opt/firstboot/setup.sh
RUN systemctl enable autowrx-firstboot.service

# Set default runlevel and services
RUN systemctl set-default multi-user.target
RUN systemctl disable graphical.target

# Clean up
RUN apt-get autoremove -y
RUN apt-get clean

EOF
```

### 1.2 First Boot Configuration

#### First Boot Service
```ini
# /etc/systemd/system/autowrx-firstboot.service
[Unit]
Description=AutoWRX First Boot Configuration
After=network-online.target
Wants=network-online.target
Before=autowrx-agent.service
ConditionPathExists=!/opt/autowrx/.firstboot-complete

[Service]
Type=oneshot
ExecStart=/opt/firstboot/setup.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

#### First Boot Script
```bash
#!/bin/bash
# /opt/firstboot/setup.sh

set -e

LOG_FILE="/var/log/autowrx-firstboot.log"
exec > "$LOG_FILE" 2>&1

echo "=== AutoWRX First Boot Setup ===" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"

# Generate unique device ID
DEVICE_ID="autowrx-$(cat /proc/sys/kernel/random/uuid | cut -d'-' -f1)"
echo "Generated Device ID: $DEVICE_ID" | tee -a "$LOG_FILE"

# Configure system settings
echo "Configuring system settings..." | tee -a "$LOG_FILE"

# Set hostname
hostnamectl set-hostname "$DEVICE_ID"

# Configure network
echo "Configuring network..." | tee -a "$LOG_FILE"
netplan apply

# Enable and start required services
echo "Starting required services..." | tee -a "$LOG_FILE"
systemctl enable systemd-resolved
systemctl start systemd-resolved

# Configure device agent
echo "Configuring AutoWRX Device Agent..." | tee -a "$LOG_FILE"
cat > /opt/autowrx/config/device.json << EOF
{
  "device_id": "$DEVICE_ID",
  "name": "AutoWRX Device $DEVICE_ID",
  "type": "automotive-grade",
  "manufacturer": "AutoWRX",
  "model": "Automotive Device v1.0",
  "version": "1.0.0",
  "capabilities": {
    "runtime": ["docker", "native"],
    "resources": {
      "cpu_cores": $(nproc),
      "memory_gb": $(awk '/MemTotal/ {print int($2/1024/1024)}' /proc/meminfo),
      "storage_gb": $(df / | awk 'NR==2{print int($4/1024/1024)}')
    },
    "interfaces": {
      "can": true,
      "ethernet": true,
      "wifi": true,
      "gps": true
    },
    "automotive": {
      "can_interfaces": ["can0", "can1"],
      "diagnostic_protocols": ["obd2", "uds", "doip"],
      "safety_level": "asil_b"
    }
  },
  "network": {
    "interfaces": [],
    "preferred_ip": "auto",
    "mdns_enabled": true
  },
  "kuksa": {
    "auto_discovery": true,
    "fallback_broker": true,
    "preferred_version": "5.0",
    "required_signals": []
  },
  "security": {
    "authentication_required": true,
    "encryption_enabled": true,
    "sandbox_enforced": true,
    "access_level": "managed"
  }
}
EOF

# Configure autowrx-agent service
echo "Configuring AutoWRX Agent service..." | tee -a "$LOG_FILE"
cat > /etc/systemd/system/autowrx-agent.service << EOF
[Unit]
Description=AutoWRX Device Agent
After=network-online.target docker.service
Wants=network-online.target docker.service
Requires=docker.socket

[Service]
Type=simple
ExecStart=/opt/autowrx/bin/device-agent
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
User=autowrx
Group=autowrx
Environment=AUTOWRX_CONFIG=/opt/autowrx/config/device.json
Environment=LOG_LEVEL=INFO
Environment=METRICS_ENABLED=true

[Install]
WantedBy=multi-user.target
EOF

# Start autowrx agent
echo "Starting AutoWRX Agent..." | tee -a "$LOG_FILE"
systemctl daemon-reload
systemctl enable autowrx-agent.service
systemctl start autowrx-agent.service

# Configure security
echo "Configuring security..." | tee -a "$LOG_FILE"
chmod 600 /opt/autowrx/config/device.json
chown autowrx:autowrx /opt/autowrx/config/device.json

# Create first boot complete marker
touch /opt/autowrx/.firstboot-complete
echo "=== First Boot Setup Complete ===" | tee -a "$LOG_FILE"
echo "Device ID: $DEVICE_ID" | tee -a "$LOG_FILE"
echo "Ready for AutoWRX Discovery" | tee -a "$LOG_FILE"

# Reboot to apply all changes
reboot
```

## 2. Manufacturing Integration

### 2.1 Flash Script for Manufacturing

#### Automated Flash Script
```bash
#!/bin/bash
# flash-automotive-device.sh

set -e

DEVICE_TYPE=$1
SERIAL_NUMBER=$2
PRODUCTION_LINE=$3
IMAGES_PATH="/opt/manufacturing/images"

echo "=== AutoWRX Device Flashing ==="
echo "Device Type: $DEVICE_TYPE"
echo "Serial Number: $SERIAL_NUMBER"
echo "Production Line: $PRODUCTION_LINE"

# Validate inputs
if [ -z "$DEVICE_TYPE" ] || [ -z "$SERIAL_NUMBER" ]; then
    echo "Error: Device type and serial number required"
    exit 1
fi

# Select appropriate OS image
case $DEVICE_TYPE in
    "jetson-orin")
        OS_IMAGE="$IMAGES_PATH/autowrx-jetson-orin.img"
        FLASH_COMMAND="sudo ./flash.sh"
        ;;
    "automotive-ecu")
        OS_IMAGE="$IMAGES_PATH/autowrx-automotive-ecu.img"
        FLASH_COMMAND="sudo ./flash-ecu.sh"
        ;;
    "generic-linux")
        OS_IMAGE="$IMAGES_PATH/autowrx-linux-generic.img"
        FLASH_COMMAND="sudo ./flash-linux.sh"
        ;;
    *)
        echo "Error: Unsupported device type: $DEVICE_TYPE"
        exit 1
        ;;
esac

echo "Flashing device with OS image..."
$FLASH_COMMAND "$OS_IMAGE"

# Wait for device to be ready
echo "Waiting for device to be ready..."
sleep 30

# Configure device for production
echo "Configuring device for production..."

# SSH into device and run production setup
ssh root@device.local << 'EOF'
# Production configuration
echo "SERIAL_NUMBER='$SERIAL_NUMBER'" >> /opt/autowrx/config/device.json
echo "PRODUCTION_LINE='$PRODUCTION_LINE'" >> /opt/autowrx/config/device.json
echo "MANUFACTURING_MODE=true" >> /opt/autowrx/config/device.json
echo "SECURITY_LEVEL=automotive_grade" >> /opt/autowrx/config/device.json

# Enable automotive features
sed -i 's/"can_interfaces": \[\]/"can_interfaces": ["can0", "can1"]/' /opt/autowrx/config/device.json
sed -i 's/"safety_level": "basic"/"safety_level": "asil_b"/' /opt/autowrx/config/device.json

# Disable development features
sed -i 's/"debug_enabled": true/"debug_enabled": false/' /opt/autowrx/config/device.json
sed -i 's/"shell_access": true/"shell_access": false/' /opt/autowrx/config/device.json

# Restart autowrx agent
systemctl restart autowrx-agent.service
EOF

echo "Device flashing and configuration complete!"
echo "Device ID will be generated on first boot"
```

### 2.2 Quality Assurance Integration

#### Manufacturing Test Suite
```python
#!/usr/bin/env python3
# manufacturing_test_suite.py

import requests
import pytest
import time
import json

class ManufacturingTestSuite:
    def __init__(self, device_ip):
        self.device_ip = device_ip
        self.base_url = f"http://{device_ip}:8080"

    def test_device_registration(self):
        """Test device registration and discovery"""
        response = requests.get(f"{self.base_url}/api/v1/device/info")

        assert response.status_code == 200
        device_info = response.json()

        # Verify required fields
        required_fields = ['device_id', 'name', 'type', 'capabilities']
        for field in required_fields:
            assert field in device_info, f"Missing required field: {field}"

        # Verify automotive-grade capabilities
        assert device_info['capabilities']['automotive']['safety_level'] in ['asil_a', 'asil_b', 'asil_c', 'asil_d']
        assert device_info['capabilities']['interfaces']['can'] == True

        print(f"✅ Device registration test passed - Device ID: {device_info['device_id']}")
        return device_info

    def test_kuksa_integration(self):
        """Test Kuksa VSS integration"""
        response = requests.get(f"{self.base_url}/api/v1/kuksa/status")

        assert response.status_code == 200
        kuksa_status = response.json()

        assert kuksa_status['broker_running'] == True
        assert kuksa_status['vss_loaded'] == True

        print("✅ Kuksa integration test passed")
        return kuksa_status

    def test_deployment_readiness(self):
        """Test deployment readiness"""
        response = requests.get(f"{self.base_url}/api/v1/health")

        assert response.status_code == 200
        health = response.json()

        assert health['status'] == 'healthy'
        assert health['services']['agent'] == 'running'
        assert health['services']['docker'] == 'running'

        print("✅ Deployment readiness test passed")
        return health

    def test_security_hardening(self):
        """Test security configurations"""
        response = requests.get(f"{self.base_url}/api/v1/security/status")

        assert response.status_code == 200
        security = response.json()

        assert security['encryption']['tls_enabled'] == True
        assert security['firewall']['default_deny'] == True
        assert security['sandbox']['enforced'] == True

        print("✅ Security hardening test passed")
        return security

    def run_full_test_suite(self):
        """Run complete manufacturing test suite"""
        results = {
            'device_registration': self.test_device_registration(),
            'kuksa_integration': self.test_kuksa_integration(),
            'deployment_readiness': self.test_deployment_readiness(),
            'security_hardening': self.test_security_hardening()
        }

        print("=== Manufacturing Test Suite Complete ===")
        print(f"Tests passed: {len([k for k,v in results.items() if v])}")
        print(f"Total tests: {len(results)}")

        return results

# Usage in manufacturing line
if __name__ == "__main__":
    import sys

    device_ip = sys.argv[1] if len(sys.argv) > 1 else "192.168.1.100"

    test_suite = ManufacturingTestSuite(device_ip)
    results = test_suite.run_full_test_suite()

    # Generate test report
    with open(f"/opt/manufacturing/test_reports/device_{device_ip.replace('.', '_')}.json", 'w') as f:
        json.dump(results, f, indent=2)
```

## 3. Fleet Deployment Automation

### 3.1 Remote Deployment Framework

#### Fleet Deployment Orchestrator
```python
#!/usr/bin/env python3
# fleet_deployment_orchestrator.py

import asyncio
import aiohttp
import json
from typing import List, Dict
import logging

class FleetDeploymentOrchestrator:
    def __init__(self):
        self.devices = []
        self.deployment_status = {}
        self.session = None

    async def discover_devices(self, network_range="192.168.1.0/24"):
        """Auto-discover devices on network"""
        # Implementation for network scanning
        pass

    async def deploy_to_fleet(self, package_info, device_filter=None):
        """Deploy application to entire fleet"""
        target_devices = self.get_target_devices(device_filter)

        # Parallel deployment to all devices
        deployment_tasks = []
        for device in target_devices:
            task = self.deploy_to_device(device, package_info)
            deployment_tasks.append(task)

        results = await asyncio.gather(*deployment_tasks, return_exceptions=True)

        return self.process_deployment_results(results)

    async def deploy_to_device(self, device, package_info):
        """Deploy to single device"""
        try:
            # Check device compatibility
            if not await self.check_compatibility(device, package_info):
                return {"device": device['id'], "status": "incompatible"}

            # Stage package on device
            await self.stage_package(device, package_info)

            # Install package
            await self.install_package(device, package_info)

            # Configure and start
            await self.configure_application(device, package_info)

            # Verify deployment
            health_status = await self.verify_deployment(device, package_info)

            return {
                "device": device['id'],
                "status": "success",
                "health": health_status
            }

        except Exception as e:
            return {
                "device": device['id'],
                "status": "error",
                "error": str(e)
            }
```

### 3.2 Zero-Touch Configuration

#### Remote Configuration Manager
```yaml
# config/fleet-deployment.yaml

fleet_configuration:
  auto_discovery:
    enabled: true
    network_ranges:
      - "192.168.1.0/24"
      - "10.0.0.0/8"
    scan_interval: 300  # 5 minutes

  device_categories:
    development:
      auto_deploy: false
      security_level: "basic"
      monitoring: "full"

    testing:
      auto_deploy: true
      security_level: "enhanced"
      monitoring: "full"

    production:
      auto_deploy: true
      security_level: "military"
      monitoring: "full"
      health_checks: "continuous"

  deployment_strategies:
    canary:
      percentage: 10
      auto_rollback: true
      monitoring_duration: 3600  # 1 hour

    blue_green:
      switchback_timeout: 300
      health_check_interval: 30

    rolling:
      batch_size: 5
      batch_interval: 300

    parallel:
      max_concurrent: 50
      timeout: 1800  # 30 minutes

  security:
    certificate_management: "auto"
    key_rotation_interval: 86400  # 24 hours
    compliance_checks: "continuous"
```

#### Remote Configuration Script
```bash
#!/bin/bash
# remote-configure.sh - Auto-deployed configuration script

set -e

CONFIG_URL="$1"
DEVICE_ID="$2"
AUTH_TOKEN="$3"

echo "=== Remote Configuration for Device: $DEVICE_ID ==="

# Download configuration
echo "Downloading configuration..."
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     "$CONFIG_URL/devices/$DEVICE_ID/config" \
     -o /tmp/device-config.json

# Apply configuration
echo "Applying configuration..."
/opt/autowrx/bin/config-manager apply /tmp/device-config.json

# Update device registration
echo "Updating device registration..."
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d @/tmp/device-config.json \
     "$CONFIG_URL/devices/$DEVICE_ID/update"

# Restart services if needed
if [ "$4" = "--restart" ]; then
    echo "Restarting services..."
    systemctl restart autowrx-agent.service
fi

echo "Remote configuration complete!"
```

## 4. Production Hardening

### 4.1 Security Configuration

#### Automotive Security Profile
```yaml
automotive_security_profile:
  authentication:
    multi_factor: true
    certificate_validation: strict
    token_refresh_interval: 3600

  network_security:
    firewall_default_deny: true
    allowed_services: ["http", "https", "mqtt", "mdns"]
    intrusion_detection: true
    fail2ban_enabled: true

  application_security:
    sandbox_enforcement: strict
    resource_limits:
      memory: "512MB per app"
      cpu: "50% per app"
      network: "Kuksa-only default"

  data_protection:
    encryption_at_rest: "AES-256-GCM"
    encryption_in_transit: "TLS-1.3"
    secure_boot: true
    measured_boot: true
```

#### Security Hardening Script
```bash
#!/bin/bash
# security-hardening.sh

echo "=== Automotive Security Hardening ==="

# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups
systemctl disable avahi-daemon
systemctl disable cups-browsed

# Configure firewall
ufw default deny incoming
ufw allow out
ufw allow ssh
ufw allow from 192.168.0.0/16 to any port 8080
ufw allow from 192.168.0.0/16 to any port 1883
ufw enable

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[autowrx-api]
enabled = true
port = 8080
logpath = /var/log/autowrx/agent.log
maxretry = 3
bantime = 1800
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configure sysctl hardening
cat >> /etc/sysctl.conf << EOF
# Network hardening
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# TCP/IP hardening
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Kernel hardening
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Memory protection
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sysctl -p

# Configure secure boot (if supported)
if [ -d /sys/firmware/efi ]; then
    echo "Configuring secure boot..."
    # Secure boot configuration would go here
fi

echo "Security hardening complete!"
```

### 4.2 Performance Optimization

#### Real-time Optimizations
```bash
#!/bin/bash
# realtime-optimization.sh

echo "=== Real-time Performance Optimization ==="

# Configure CPU governor
echo "powersave" > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Configure CPU affinity
echo "Setting up CPU affinity for real-time tasks..."
# Set CPU affinity for critical processes

# Configure memory management
echo "Configuring memory management..."
echo 'vm.swappiness=10' >> /etc/sysctl.conf
echo 'vm.dirty_ratio=15' >> /etc/sysctl.conf
echo 'vm.dirty_background_ratio=5' >> /etc/sysctl.conf

# Configure network for low latency
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_rmem = 4096 65536 16777216' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_wmem = 4096 65536 16777216' >> /etc/sysctl.conf

sysctl -p

# Disable unnecessary services for real-time performance
systemctl disable snapd
systemctl disable apport
systemctl disable rsyslog
systemctl enable systemd-journald

echo "Real-time optimization complete!"
```

## 5. Monitoring and Diagnostics

### 5.1 Automotive-Grade Monitoring

#### Monitoring Agent Configuration
```yaml
# monitoring/automotive-monitoring.yaml

monitoring_configuration:
  health_checks:
    interval: 30  # seconds
    timeout: 10   # seconds

  metrics_collection:
    system_metrics:
      interval: 60
      metrics:
        - cpu_usage
        - memory_usage
        - disk_io
        - network_io
        - temperature

    application_metrics:
      interval: 30
      metrics:
        - app_status
        - error_count
        - response_time
        - kuksa_connection_status

    automotive_metrics:
      interval: 10
      metrics:
        - can_bus_status
        - can_message_rate
        - signal_integrity
        - ecu_communication_status

  alerts:
    critical:
      - system_cpu_usage > 90%
      - system_memory_usage > 95%
      - application_down
      - kuksa_connection_lost

    warning:
      - system_cpu_usage > 75%
      - system_memory_usage > 85%
      - high_error_rate
      - network_latency > 100ms

    info:
      - device_offline
      - configuration_changed
      - application_restarted
```

### 5.2 Diagnostic Tools

#### Automotive Diagnostic Suite
```python
#!/usr/bin/env python3
# automotive_diagnostic_suite.py

import asyncio
import aiohttp
import json
import time
from datetime import datetime

class AutomotiveDiagnostics:
    def __init__(self, device_ip):
        self.device_ip = device_ip
        self.base_url = f"http://{device_ip}:8080"

    async def run_full_diagnostics(self):
        """Run complete diagnostic suite"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'device_id': await self.get_device_id(),
            'tests': {}
        }

        # System diagnostics
        results['tests']['system'] = await self.run_system_diagnostics()

        # Network diagnostics
        results['tests']['network'] = await self.run_network_diagnostics()

        # Automotive interfaces
        results['tests']['automotive'] = await self.run_automotive_diagnostics()

        # Kuksa diagnostics
        results['tests']['kuksa'] = await self.run_kuksa_diagnostics()

        # Performance diagnostics
        results['tests']['performance'] = await self.run_performance_diagnostics()

        return results

    async def run_automotive_diagnostics(self):
        """Test automotive interfaces"""
        async with aiohttp.ClientSession() as session:
            # Test CAN bus interfaces
            can_result = await self.test_can_interfaces(session)

            # Test diagnostic protocols
            diag_result = await self.test_diagnostic_protocols(session)

            # Test GPS connectivity
            gps_result = await self.test_gps_connectivity(session)

            return {
                'can_interfaces': can_result,
                'diagnostic_protocols': diag_result,
                'gps_connectivity': gps_result,
                'overall_status': self.evaluate_automotive_status(can_result, diag_result, gps_result)
            }
```

## 6. Maintenance and Updates

### 6.1 OTA Update Framework

#### OTA Update Configuration
```yaml
# ota/update-manager.yaml

ota_configuration:
  update_channels:
    stable:
      frequency: "monthly"
      auto_approve: true
      testing_duration: 72  # hours
      rollback_threshold: 5

    beta:
      frequency: "bi-weekly"
      auto_approve: false
      testing_duration: 48  # hours
      rollback_threshold: 3

    experimental:
      frequency: "weekly"
      auto_approve: false
      testing_duration: 24  # hours
      rollback_threshold: 2

  update_procedure:
    1. "Download package"
    2. "Verify integrity"
    3. "Backup current state"
    4. "Stage update"
    5. "Run compatibility check"
    6. "Perform update"
    7. "Verify functionality"
    8. "Commit or rollback"

  rollback_procedure:
    1. "Detect failure"
    2. "Stop new update"
    3. "Restore backup"
    4. "Verify restoration"
    5. "Report status"
    6. "Root cause analysis"
```

#### OTA Update Implementation
```python
#!/usr/bin/env python3
# ota_update_manager.py

import asyncio
import hashlib
import requests
import json
from pathlib import Path

class OTAUpdateManager:
    def __init__(self, device_id):
        self.device_id = device_id
        self.backup_dir = Path(f"/opt/autowrx/backups")
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    async def check_for_updates(self, update_channel="stable"):
        """Check for available updates"""
        response = requests.get(
            f"https://updates.autowrx.io/api/v1/updates/check",
            params={
                "device_id": self.device_id,
                "channel": update_channel,
                "current_version": self.get_current_version()
            }
        )

        return response.json()

    async def download_update(self, update_info):
        """Download update package"""
        package_url = update_info['package_url']
        checksum = update_info['checksum']

        # Download package
        response = requests.get(package_url, stream=True)
        package_path = f"/tmp/update_{update_info['version']}.tar.gz"

        with open(package_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # Verify checksum
        calculated_checksum = self.calculate_checksum(package_path)
        if calculated_checksum != checksum:
            raise ValueError("Checksum verification failed")

        return package_path

    async def perform_update(self, package_path):
        """Perform OTA update"""
        # Create backup
        backup_path = await self.create_backup()

        try:
            # Stage update
            await self.stage_update(package_path)

            # Run compatibility check
            if not await self.run_compatibility_check():
                raise Exception("Compatibility check failed")

            # Perform update
            await self.apply_update()

            # Verify update
            if await self.verify_update():
                # Commit update
                await self.commit_update()
                return True
            else:
                # Rollback
                await self.rollback_update(backup_path)
                return False

        except Exception as e:
            # Rollback on any error
            await self.rollback_update(backup_path)
            raise e
```

## 7. Production Deployment Checklist

### 7.1 Pre-Deployment Checklist

#### Device Readiness
```yaml
device_readiness:
  hardware:
    - [ ] CPU meets minimum requirements (4+ cores recommended)
    - [ ] RAM meets minimum requirements (8GB+ recommended)
    - [ ] Storage meets minimum requirements (64GB+ recommended)
    - [ ] Network interfaces operational
    - [ ] Automotive interfaces available (CAN, GPS, etc.)

  software:
    - [ ] OS installed and updated
    - [ ] Docker installed and running
    - [ ] Python 3.9+ installed
    - [ ] System services configured
    - [ ] Security hardening applied

  networking:
    - [ ] IP address assigned
    - [ ] Internet connectivity available
    - [ ] Firewall rules configured
    - [ ] DNS resolution working
    - [ ] Time synchronization configured
```

### 7.2 Post-Deployment Verification

#### Verification Tests
```bash
#!/bin/bash
# post_deployment_verification.sh

echo "=== Post-Deployment Verification ==="

# Test device registration
echo "Testing device registration..."
curl -f http://localhost:8080/api/v1/device/info | jq .

# Test API connectivity
echo "Testing API connectivity..."
curl -f http://localhost:8080/api/v1/health | jq .

# Test application deployment
echo "Testing application deployment..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"package_id": "test-package", "version": "1.0.0"}' \
  http://localhost:8080/api/v1/deployments | jq .

# Test Kuksa integration
echo "Testing Kuksa integration..."
curl -f http://localhost:8080/api/v1/kuksa/status | jq .

# Generate verification report
echo "Generating verification report..."
./automotive_diagnostic_suite.py > /opt/autowrx/reports/verification_report.json

echo "Verification complete!"
```

This comprehensive automotive-grade deployment setup ensures that devices with new OS installations can be seamlessly integrated into the AutoWRX SDV deployment system with zero-touch configuration, automated setup, and production-grade reliability. The solution is designed for manufacturing scale, fleet management, and automotive industry standards compliance. 🚗💨