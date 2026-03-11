# AOS Cloud Deployment Plugin

A plugin for building and deploying C++ applications to AOS (Automotive Open System) Cloud edge devices.

## Features

- **C++ Code Editor**: CodeMirror 6 based editor with syntax highlighting
- **YAML Config Editor**: Edit AOS application configuration (config.yaml)
- **Docker Build**: Build and deploy applications via WebSocket to Docker service
- **Real-time Status**: View build progress and application status
- **App Management**: Start and stop deployed applications
- **Preset Examples**: Includes hello-aos example application

## Architecture

```
aos-cloud-deployment/
├── src/
│   ├── components/
│   │   ├── Page.tsx       # Main UI component
│   │   └── Page.css       # Plugin styles
│   ├── services/
│   │   └── aos.service.ts # WebSocket service for Docker communication
│   ├── types/
│   │   └── index.ts       # TypeScript type definitions
│   ├── presets/
│   │   └── index.ts       # Example C++ code and config.yaml
│   └── index.ts           # Plugin entry point
├── index.js               # Built plugin bundle (output)
├── build.sh               # Build script
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── server.js              # Dev server with CORS
└── README.md              # This file
```

## Building

```bash
cd backend/static/plugin/aos-cloud-deployment
chmod +x build.sh
./build.sh
```

## Development

```bash
# Terminal 1: Start dev server
npm run serve

# Terminal 2: Watch and rebuild on changes
npm run dev
```

## Usage

1. Select or enter your C++ source code
2. Configure the AOS application in config.yaml
3. Click "Build & Deploy"
4. Monitor build logs and application status

## WebSocket Protocol

The plugin communicates with the Docker build service via Socket.IO using the Kit Manager protocol:

- **aos_build_deploy**: Build and deploy a C++ application
- **aos_list_apps**: List deployed applications
- **aos_start_app**: Start an application
- **aos_stop_app**: Stop an application
- **aos_console_subscribe**: Subscribe to console output

## Based on

- `sample-tsx`: Standard plugin template
- `vehicle-edge-runtime`: WebSocket communication pattern
- `aos-edge-toolchain`: AOS build configuration format
