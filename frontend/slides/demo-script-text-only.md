# Vehicle Edge Runtime - Demo Script

## Part 1: Code Prototyping Complete

Before we begin the live demo, I want to mention that we've already successfully prototyped our Python vehicle application code in the SDV Code tab.

The application is a vehicle signal monitoring app that connects to KUKSA Data Broker, subscribes to vehicle signals like speed and battery, and processes real-time data. The code has been written, tested, and validated.

---

## Part 2: Vehicle Edge Runtime Setup

Now let's switch to the Vehicle-Edge-Runtime tab to deploy our application.

The Overview tab shows all connected vehicle edge runtime devices. Currently, we don't have any devices connected yet.

To connect a device, I'll click the Add Device button, which launches the Device Setup Wizard.

---

The Device Setup Wizard appears with a multi-step form. Let me walk through each step:

**Step 1 - Device Information:**
I enter a Device Name, for example "test-device-1", add a Description like "Development test device", and provide the WebSocket URL that points to our vehicle edge runtime.

**Step 2 - Connection Test:**
Once I click Next, the wizard automatically tests the WebSocket connection to verify the device is reachable. You can see the connection status indicator here - green means successful.

**Step 3 - Device Configuration:**
In this step, I configure runtime settings like CPU and memory limits for applications, network policies, and security options. For this demo, I'll use the default settings which work well for development.

**Step 4 - Review & Confirm:**
The final step shows a summary of all settings. I review the configuration one more time, then click Finish to complete the setup.

---

Excellent! Now we can see our Vehicle Edge Runtime device in the Overview tab:
- Status: Connected (green indicator)
- Platform information and resource metrics
- Currently 0 applications running

The device is now ready to receive vehicle applications!

---

## Part 3: Deployment - Python Application

With our device connected, let's move to the Deployment tab.

On the left, we see the Deployment Type selector with three options:
- Python Application - best for rapid prototyping and data processing
- Binary Application - for compiled executables (C/C++, Rust)
- Docker Application - for complex microservices

Today, we'll select Python Application.

---

Now let's deploy the essential infrastructure components using the Quick Deploy feature.

First, I'll deploy KUKSA Data Broker - the Vehicle Signal Server that implements the VSS standard. It acts as the central pub/sub broker for all vehicle signals.

I'll click the Deploy button here. The system automatically creates the container and starts KUKSA. Once running, it's available for vehicle signal subscriptions.

---

Next, I'll deploy Mock Services to simulate vehicle data for testing. This provides realistic signal values (speed, RPM, fuel, battery, GPS) without needing real hardware.

I'll click Deploy for Mock Services as well.

Now we have both KUKSA Data Broker and Mock Services running. Vehicle data is flowing: Mock Services → KUKSA → ready for applications.

---

Now let's deploy our custom Python application. In the Application Details section:

I'll fill in three fields:
1. Application ID: vehicle-signal-monitor - this is a unique identifier
2. Display Name: Vehicle Signal Monitor - this is the human-readable name
3. Description: Real-time vehicle speed, battery, and sensor monitoring

---

Next is the Application Code section with Monaco Editor. It includes:
- Syntax highlighting for Python
- Line numbers and auto-indentation
- Code auto-save every 3 seconds

The editor comes pre-filled with a Velocitas example template that shows how to connect to KUKSA and subscribe to vehicle signals. For this demo, I'll use the default template code.

---

One of the most powerful features is automatic dependency management:

Fixed Dependencies (always included):
- kuksa-client - Python client for KUKSA
- velocitas-sdk - Eclipse Velocitas SDK

Auto-Detected Dependencies:
The system automatically parses our code and detects imported packages like numpy, pandas, etc.

Manual Dependencies:
We can also add any PyPI packages manually.

For our demo, only the fixed dependencies are needed - the auto-detection saves time and prevents errors!

---

There's also a Signal Validation feature that lets us browse the VSS tree, search for signals, and validate that the signals we're using actually exist - preventing deployment errors.

---

Everything is configured! Let's deploy by clicking the Deploy Application button.

Watch the Console Output at the bottom - we can see:
1. Application package being created
2. Dependencies being resolved and installed
3. Container being created on the device
4. Application starting and connecting to KUKSA

Deployment takes 10-20 seconds...

---

## Part 4: Applications Tab - Monitoring

Great! Deployment is complete. Now let's switch to the Applications tab to see our running application.

Here's our Vehicle Signal Monitor application card showing:
- Application name and ID
- Status: Running (green badge with pulse indicator)
- Control buttons: Start, Pause, Resume, Stop, Restart, Uninstall
- Currently running, so Pause/Stop/Restart/Uninstall are available

---

When I click the card, it expands to show real-time console output:

[INFO] Starting vehicle application...
[INFO] Connecting to KUKSA...
[SUCCESS] Connected to KUKSA successfully!
[INFO] Subscribing to Vehicle.Speed...
[SUCCESS] All subscriptions confirmed!
[DATA] Speed: 5.2 km/h | Battery: 98%
[DATA] Speed: 12.8 km/h | Battery: 97% | Steering: 0°
[DATA] Speed: 25.4 km/h | Battery: 96% | Steering: -5°

We can see:
- INFO messages (green) - successful operations
- SUCCESS messages (green) - key milestones
- DATA messages (yellow) - real-time vehicle signal values!

Our application is actively receiving vehicle data from KUKSA!

---

If I click the three-dot menu, there are additional options like View Logs, Download Logs, Edit Application, View Dependencies, and Application Metrics - powerful for debugging and monitoring.

---

Let's see all running applications on this device:

We now have three applications running:

1. KUKSA Data Broker - Infrastructure service for signal management
2. Mock Services - Generating simulated vehicle data
3. Vehicle Signal Monitor - Our custom Python app consuming real-time data

All three are running simultaneously in isolated containers, communicating through KUKSA Data Broker!

---

## Part 5: Summary

Let's recap what we've accomplished:

Prototyped Python vehicle application in SDV Code tab
Connected vehicle edge runtime device via Setup Wizard
Deployed KUKSA Data Broker via Quick Deploy (one-click)
Deployed Mock Services for vehicle data simulation
Configured custom application with details, code, and dependencies
Deployed application with single click
Monitored real-time console output showing live vehicle data

---

Key Platform Capabilities:

- Multi-language support (Python, Binary, Docker)
- Auto-dependency management
- Quick Deploy templates for infrastructure
- Real-time WebSocket communication
- Complete application lifecycle management
- Multi-application support with isolated containers
- VSS compliant for interoperability

---

Complete System Running:

We now have a fully operational vehicle edge runtime with:
- playground.digital.auto - Frontend managing deployment
- Kit Manager - Cloud orchestration
- Vehicle Edge Runtime Device hosting:
  - KUKSA Data Broker - Vehicle signal broker
  - Mock Services - Vehicle data simulation
  - Vehicle Signal Monitor - Real-time data consumption

All components communicating in real-time via WebSocket and gRPC!

This demonstrates the complete flow from idea to running vehicle application in minutes. The platform abstracts away container orchestration complexity, allowing developers to focus on writing vehicle applications that deliver value. Thank you!

---

## End of Demo Script
