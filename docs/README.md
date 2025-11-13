# AutoWRX Documentation

Welcome to the AutoWRX documentation hub. This directory contains comprehensive documentation for the AutoWRX platform and its features.

## 📚 Documentation Structure

### 🚀 **SDV Deployment Feature** (NEW)
**Software Defined Vehicle Deployment Architecture** - Complete integration guide for deploying Python vehicle apps from web IDE to real automotive devices.

**Location**: [`sdv/`](./sdv/)

**Key Documents**:
- 📖 [Quick Start Guide](./sdv/README_SDV_DEPLOYMENT.md) - Get started with SDV deployment
- 🏗️ [Architecture Blueprint](./sdv/AUTOWRX_SDV_ARCHITECTURE_BLUEPRINT.md) - Complete system design
- 👥 [Team Integration Guide](./sdv/TEAM_INTEGRATION_GUIDE.md) - Implementation guide for v3-base team
- 🔧 [Implementation Guide](./sdv/SDV_IMPLEMENTATION_GUIDE.md) - Technical specifications
- ⚡ [Integration Cheatsheet](./sdv/SDV_INTEGRATION_CHEATSHEET.md) - Quick reference

**Overview**: The SDV deployment feature enables developers to deploy Python vehicle applications directly from the AutoWRX web IDE to any SDV-compatible device, including NVIDIA Jetson Orin, generic Linux systems, and automotive prototypes. It features automatic device discovery, Kuksa Databroker integration, hot-swapping capabilities, and real-time monitoring.

### 🎨 **Component Design**
**UI/UX Component Architecture** - Design patterns and component specifications for the AutoWRX interface.

**Location**: [`component-design/`](./component-design/)

### 🔐 **Authentication & Security**
**Security Implementation** - Authentication flows, token handling, and security best practices.

**Files**:
- [`authentication-cookie-handling.md`](./authentication-cookie-handling.md)

### 🚀 **Deployment**
**Platform Deployment** - Instructions for deploying AutoWRX in various environments.

**Location**: [`deployment/`](./deployment/)

### 📋 **Project Planning**
**Architecture and Planning Documents** - High-level design decisions and project structure.

**Files**:
- [`concept.md`](./concept.md) - Project concept and vision
- [`layout.md`](./layout.md) - System layout overview
- [`principle.md`](./principle.md) - Design principles
- [`project-structure.md`](./project-structure.md) - Code organization
- [`tam_proposed_plan.md`](./tam_proposed_plan.md) - Technical architecture plan
- [`feature-breakdown.md`](./feature-breakdown.md) - Feature specifications

### 🎯 **Feature Specifications**
**Detailed Feature Documentation** - Specific features and their implementations.

**Files**:
- [`core-vs-plugin.md`](./core-vs-plugin.md) - Core platform vs plugin architecture

## 🆕 What's New

### SDV Deployment Architecture (Latest)
The most significant addition to AutoWRX is the **SDV deployment architecture**, which transforms AutoWRX from a web-based prototyping tool into a complete SDV development and deployment platform.

**Key Benefits**:
- 🚀 **End-to-End Workflow**: From prototype to deployed vehicle application
- 📱 **Multi-Device Support**: Jetson Orin, Linux devices, automotive prototypes
- 🔗 **Kuksa Integration**: Automatic vehicle communication setup
- 🔄 **Hot-Swapping**: Update apps without vehicle downtime
- 📊 **Real-Time Monitoring**: Track deployment progress and app health

**For Developers**: See the [Team Integration Guide](./sdv/TEAM_INTEGRATION_GUIDE.md) for detailed implementation instructions.

## 🚀 Getting Started

### For New Users
1. **Read the Concept**: [`concept.md`](./concept.md) to understand AutoWRX's vision
2. **Review Project Structure**: [`project-structure.md`](./project-structure.md) to understand codebase
3. **Check Component Design**: [`component-design/`](./component-design/) for UI patterns

### For Developers
1. **SDV Integration**: Start with [SDV Team Integration Guide](./sdv/TEAM_INTEGRATION_GUIDE.md)
2. **Component Guidelines**: Review [`component-design/`](./component-design/) for UI patterns
3. **Authentication**: Study [`authentication-cookie-handling.md`](./authentication-cookie-handling.md)
4. **Architecture**: Review [`tam_proposed_plan.md`](./tam_proposed_plan.md) for technical decisions

### For System Administrators
1. **Deployment**: See [`deployment/`](./deployment/) for setup instructions
2. **Security**: Review authentication and security documentation

## 📖 Document Categories

### 🏗️ **Architecture Documents**
- System design and architecture
- Integration patterns
- Technology stack decisions
- Future roadmap planning

### 👥 **Development Guides**
- Implementation instructions
- Code patterns and conventions
- Testing strategies
- Development workflows

### 🔧 **Technical Specifications**
- API documentation
- Component specifications
- Database schemas
- Configuration guides

### 📚 **User Documentation**
- Getting started guides
- Feature tutorials
- Troubleshooting guides
- Best practices

## 🔄 Documentation Maintenance

### Guidelines
- **Keep it Current**: Update documentation when code changes
- **Be Consistent**: Follow established formatting patterns
- **Include Examples**: Add code snippets and diagrams
- **Cross-Reference**: Link between related documents

### Contributing
1. **Create New Docs**: Follow existing patterns and structure
2. **Update Existing**: Keep content accurate and relevant
3. **Add Examples**: Include practical code examples
4. **Review**: Ensure technical accuracy

## 🔗 External Resources

### AutoWRX Project
- **Main Repository**: https://github.com/eclipse-autowrx/autowrx
- **Website**: https://digital.auto/
- **Community**: Join discussions in the community forums

### Related Technologies
- **Eclipse SDV**: https://eclipse.org/sdv/
- **Kuksa Databroker**: https://github.com/eclipse/kuksa.val
- **VSS Specification**: https://github.com/COVESA/vehicle_signal_specification

## 📞 Getting Help

### Documentation Issues
- **Report Problems**: Create GitHub issues for documentation bugs
- **Request Updates**: Ask for clarification or additional information
- **Suggest Improvements**: Propose better ways to explain concepts

### Technical Support
- **Architecture Questions**: Contact the architecture team
- **Implementation Issues**: Reach out to development team
- **User Problems**: Post in user forums or support channels

---

**Last Updated**: November 2025

**AutoWRX** is a platform for developing, prototyping, and deploying Software Defined Vehicle applications. This documentation serves as the central hub for all technical information, guides, and specifications.