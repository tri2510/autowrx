# AutoWRX Local Development Stack Startup

```bash
# Start MongoDB service
./autowrx/start-mongodb.sh

# Start backend development server
cd ./autowrx/backend && yarn dev

# Start frontend development application
cd ./autowrx/frontend && yarn dev

# Start Kit Manager service
cd ./vehicle-edge-runtime/simulation && ./1-start-kit-manager.sh

# Start KUKSA server (must run before Vehicle Edge Runtime)
cd ./vehicle-edge-runtime/simulation && ./6-start-kuksa-server.sh

# Start Vehicle Edge Runtime with KUKSA support
cd ./vehicle-edge-runtime && ./scripts/start-docker-dev.sh --with-kuksa
```