# AutoWRX Extension Registry (Prototype)

This prototype service models the REST API described in the long-term plugin platform blueprint. It offers in-memory catalog data and stubbed endpoints so the frontend/backend can start integrating against a realistic contract.

## Features
- `/healthz` readiness endpoint.
- `/v1/extensions` list with optional filters.
- `/v1/extensions/:extensionId` detail view.
- `/v1/extensions/:extensionId/versions/:version` version detail (supports `latest`).
- Draft creation and release endpoints for prototyping a publish lifecycle.

## Getting Started
```bash
cd registry-service
npm install
npm run dev
```

By default the service listens on `http://localhost:4400`. You can override the port using `PORT` in `.env`.

## Next Steps
- Replace in-memory storage with persistent data store and pluggable asset backends.
- Add authentication/authorization for provider and admin operations.
- Return signed payloads and integrity metadata for bundles.
- Integrate with object storage (S3/CDN) for bundle hosting.
- Expand validation (manifest schema, permission vetting).
