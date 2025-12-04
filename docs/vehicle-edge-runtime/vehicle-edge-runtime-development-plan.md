# Vehicle Edge Runtime Development Plan

## Overview
This document tracks the development of the Vehicle Edge Runtime, starting with Version 1.0 that uses Kuksa Python as the vehicle server for development and testing purposes.

## Development Phases

### Phase 1: Foundation (Version 1.0 - Kuksa Integration)
**Goal**: Create a working Vehicle Edge Runtime using Kuksa Python as the vehicle server for development and testing.

**Scope**:
- Replace SDV-Runtime with simplified Vehicle Edge Runtime
- Integrate Kuksa Python as vehicle signal server
- Implement real-time console output streaming
- Support Python application execution in Docker
- Multi-application management and persistence

---

## Version 1.0 Development Roadmap

### Completion 1: Core Runtime Infrastructure

#### 1.1 Basic Runtime Framework
**Target**: Complete basic runtime structure and WebSocket integration

**Tasks**:
- [ ] **VE-001**: Create Vehicle Edge Runtime repository structure
- [ ] **VE-002**: Implement WebSocket server with Kit-Manager compatibility
- [ ] **VE-003**: Add runtime registration with Kit-Manager
- [ ] **VE-004**: Implement basic application execution (Python only)
- [ ] **VE-005**: Add application storage and persistence structure

**Deliverables**:
- Basic runtime that can register with Kit-Manager
- Simple Python application execution
- Application persistence across restarts

**Acceptance Criteria**:
```bash
# Runtime registers with Kit-Manager
curl http://localhost:3090/listAllKits
# Returns Vehicle Edge Runtime entry

# Python app executes and persists
docker exec vehicle-runtime python app.py
# App runs and state is saved
```

#### 1.2 Kuksa Python Integration
**Target**: Integrate Kuksa Python as the vehicle signal server

**Tasks**:
- [ ] **VE-006**: Install and configure Kuksa Python databroker
- [ ] **VE-007**: Create VSS configuration for development signals
- [ ] **VE-008**: Implement signal access validation against VSS
- [ ] **VE-009**: Add vehicle credential injection for applications
- [ ] **VE-010**: Create sample VSS JSON for testing

**Deliverables**:
- Kuksa Python databroker running alongside runtime
- VSS signal validation functionality
- Vehicle authentication system

**Acceptance Criteria**:
```python
# Kuksa databroker accessible
from kuksa_client.grpc.aio import VSSClient
client = VSSClient('localhost', 55555)
# Connection successful

# Signal validation works
runtime.validate_signal_access(['Vehicle.Speed', 'Engine.RPM'])
# Returns validation result
```

### Completion 2: Console Output System

#### 2.1 Real-time Console Implementation
**Target**: Implement real-time stdout/stderr streaming to frontend

**Tasks**:
- [ ] **VE-011**: Implement console output capture from Docker containers
- [ ] **VE-012**: Create WebSocket streaming for console output
- [ ] **VE-013**: Add output buffering and history management
- [ ] **VE-014**: Implement multi-application console management
- [ ] **VE-015**: Add console output filtering and formatting

**Deliverables**:
- Real-time console output streaming to frontend
- Console buffering during disconnections
- Multi-app console support

**Acceptance Criteria**:
```javascript
// Console streaming works
socketio.on('app_output', (data) => {
    console.log(`[${data.timestamp}] ${data.content}`);
});
// Shows real-time output from running app
```

### Completion 3: Application Management

#### 3.1 Advanced Application Features
**Target**: Complete application lifecycle management

**Tasks**:
- [ ] **VE-016**: Implement application deployment with validation
- [ ] **VE-017**: Add application start/stop/restart controls
- [ ] **VE-018**: Create application registry and metadata management
- [ ] **VE-019**: Add resource limits and isolation
- [ ] **VE-020**: Implement application update and removal

**Deliverables**:
- Complete application lifecycle management
- Application registry with metadata
- Resource management system

**Acceptance Criteria**:
```json
// App management commands work
{
    "cmd": "manage_app",
    "data": {
        "app_id": "speed_monitor_001",
        "action": "restart"
    }
}
// Application restarts with state preserved
```

### Completion 4: Testing and Integration

#### 4.1 Integration Testing
**Target**: End-to-end testing with existing frontend

**Tasks**:
- [ ] **VE-021**: Test integration with Eclipse Autowrx frontend
- [ ] **VE-022**: Validate WebSocket command compatibility
- [ ] **VE-023**: Test application deployment from frontend
- [ ] **VE-024**: Verify console output in frontend interface
- [ ] **VE-025**: Test multi-application scenarios

**Deliverables**:
- Fully integrated Vehicle Edge Runtime
- Compatibility validated with existing frontend
- Test suite with automated scenarios

**Acceptance Criteria**:
- Frontend can deploy and run applications on Vehicle Edge Runtime
- Console output appears correctly in frontend
- All WebSocket commands work as expected

#### 4.2 Documentation and Release Preparation
**Target**: Prepare for Version 1.0 release

**Tasks**:
- [ ] **VE-026**: Complete runtime setup documentation
- [ ] **VE-027**: Create developer guide for application development
- [ ] **VE-028**: Write integration guide for customers
- [ ] **VE-029**: Prepare Docker images for distribution
- [ ] **VE-030**: Create sample applications and tutorials

**Deliverables**:
- Complete documentation package
- Docker images for easy deployment
- Sample applications and tutorials

---

## Version 1.0 Architecture

### Component Structure
```
Vehicle Edge Runtime (Version 1.0)
├── Runtime Core
│   ├── WebSocket Server (Port 3090)
│   ├── Application Manager
│   └── Console Output Manager
├── Vehicle Integration
│   ├── Kuksa Python Databroker (Port 55555)
│   ├── VSS Configuration
│   └── Signal Validation
├── Application Environment
│   ├── Python Docker Containers
│   ├── Application Storage
│   └── Resource Management
└── Management Interface
    ├── Application Registry
    ├── Configuration Manager
    └── Status Monitoring
```

### Communication Flow
```
Frontend → Kit-Manager → Vehicle Edge Runtime → Python App → Kuksa Databroker
              ↓                                    ↓              ↓
        Command Routing                    Console Output    Vehicle Signals
              ↓                                    ↓              ↓
        Runtime Status                Frontend Console   Vehicle Data
```

### Development VSS Configuration
```json
{
    "Vehicle": {
        "Speed": {
            "datatype": "float",
            "type": "sensor",
            "unit": "km/h",
            "min": 0,
            "max": 300
        },
        "Engine": {
            "RPM": {
                "datatype": "uint16",
                "type": "sensor",
                "unit": "rpm",
                "min": 0,
                "max": 8000
            },
            "Temperature": {
                "datatype": "float",
                "type": "sensor",
                "unit": "°C",
                "min": -40,
                "max": 150
            }
        },
        "Transmission": {
            "Gear": {
                "datatype": "uint8",
                "type": "actuator",
                "min": 0,
                "max": 8
            }
        }
    }
}
```

---

## Development Environment Setup

### Prerequisites
```bash
# Required software
- Docker 20.10+
- Python 3.10+
- Node.js 16+
- Git

# External dependencies
- Kuksa Python Databroker 0.4.4
- Eclipse Autowrx Frontend
- Kit-Manager WebSocket Server
```

### Local Development Setup
```bash
# Clone Vehicle Edge Runtime repository
git clone https://github.com/your-org/vehicle-edge-runtime.git
cd vehicle-edge-runtime

# Setup development environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt

# Setup Kuksa Databroker
docker run -d --name kuksa-databroker \
  -p 55555:55555 \
  eclipse/kuksa-databroker:0.4.4

# Start development runtime
python src/runtime.py --dev --kuksa-url localhost:55555

# Run tests
pytest tests/
```

### Docker Development
```bash
# Build development image
docker build -t vehicle-edge-runtime:dev -f Dockerfile.dev .

# Run with Kuksa integration
docker run -d --name vehicle-runtime-dev \
  --link kuksa-databroker:kuksa \
  -p 3090:3090 \
  -e KUKSA_URL=kuksa:55555 \
  vehicle-edge-runtime:dev
```

---

## Testing Strategy

### Unit Tests
- **Runtime Core**: WebSocket server, application manager
- **Console System**: Output capture, streaming, buffering
- **VSS Validation**: Signal access validation
- **Application Lifecycle**: Deploy, start, stop, update

### Integration Tests
- **Frontend Integration**: WebSocket command compatibility
- **Kuksa Integration**: Vehicle signal communication
- **Docker Integration**: Container execution and management
- **Multi-app Scenarios**: Concurrent application execution

### End-to-End Tests
- **Complete Workflow**: Frontend → Runtime → Kuksa
- **Application Deployment**: Full application lifecycle
- **Console Output**: Real-time streaming and history
- **Error Scenarios**: Failure recovery and error handling

### Test Applications
```python
# Test application 1: Simple signal monitor
import asyncio
from kuksa_client.grpc.aio import VSSClient

async def monitor_signals():
    client = VSSClient('kuksa', 55555)
    async with client as conn:
        await conn.subscribe_current_values([
            'Vehicle.Speed', 'Vehicle.Engine.RPM'
        ])
        # Print signals to console
        print("Monitoring vehicle signals...")

# Test application 2: Signal writer
import asyncio
from kuksa_client.grpc.aio import VSSClient
from kuksa_client.grpc import Datapoint

async def write_signals():
    client = VSSClient('kuksa', 55555)
    async with client as conn:
        await conn.set_current_values({
            'Vehicle.Transmission.Gear': Datapoint(3)
        })
        print("Set transmission gear to 3")
```

---

## Success Criteria for Version 1.0

### Functional Success ✅
- [ ] Runtime registers with Kit-Manager successfully
- [ ] Python applications deploy and execute correctly
- [ ] Console output streams to frontend in real-time
- [ ] Kuksa databroker integration works properly
- [ ] Applications persist across runtime restarts

### Technical Success ✅
- [ ] All WebSocket commands from requirements implemented
- [ ] Performance meets requirements (<100ms response time)
- [ ] Resource usage stays within defined limits
- [ ] Multi-application support works correctly
- [ ] Error handling and recovery functions properly

### Integration Success ✅
- [ ] Frontend integration works without modifications
- [ ] Existing prototype applications run correctly
- [ ] Console output displays properly in frontend
- [ ] All user stories from requirements are satisfied

### Documentation Success ✅
- [ ] Complete setup and deployment documentation
- [ ] Developer guide with sample applications
- [ ] API documentation for WebSocket commands
- [ ] Troubleshooting guide for common issues

---

## Next Steps (Version 1.1 Planning)

### Future Enhancements
- [ ] Binary application execution support
- [ ] Customer vehicle server integration (replace Kuksa)
- [ ] Advanced signal conflict resolution
- [ ] Performance monitoring and metrics
- [ ] Advanced debugging features
- [ ] Cluster support for multiple runtime instances

### Customer Integration Path
1. **Version 1.0**: Kuksa-based development environment
2. **Version 1.1**: Customer vehicle server integration
3. **Version 1.2**: Customer-specific features and customizations
4. **Version 2.0**: Production-ready customer deployment

---

## Risk Management

### Technical Risks
- **Kuksa Integration**: Complex vehicle signal integration
  - **Mitigation**: Start with simple VSS, gradually add complexity
- **Performance**: Real-time console output performance
  - **Mitigation**: Implement buffering and efficient streaming
- **Docker Overhead**: Container performance impact
  - **Mitigation**: Optimize container configurations and resource limits

### Integration Risks
- **Frontend Compatibility**: WebSocket command differences
  - **Mitigation**: Thorough testing with existing frontend
- **Application Compatibility**: Python version and library conflicts
  - **Mitigation**: Fixed Python environment with preset libraries

### Timeline Risks
- **Development Time**: Underestimation of complexity
  - **Mitigation**: Regular milestone reviews and scope adjustments
- **External Dependencies**: Kuksa databroker availability
  - **Mitigation**: Local development setup and fallback plans

---

## Progress Tracking

### Current Status
- **Phase**: Sprint 1 - Week 1 (Basic Runtime Framework)
- **Progress**: Planning completed, development starting
- **Next Milestone**: Basic runtime registration and execution

### Key Metrics
- **Tasks Completed**: 0/10 (Sprint 1)
- **Test Coverage**: Target 80%
- **Performance**: Target <100ms response time
- **Stability**: Target 99% uptime

### Blocked Items
- None currently identified

### Dependencies
- Kuksa Python documentation and examples
- Eclipse Autowrx frontend API documentation
- Kit-Manager WebSocket protocol specification

---

*This document will be updated weekly with progress, completed tasks, and any adjustments to the development plan.*