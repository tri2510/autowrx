# Extension Registry Prototype

This document tracks implementation notes for Phase 2 of the AutoWRX plugin platform initiative.

## Repository Layout
- `registry-service/` – standalone Express service providing the registry API contract with in-memory data.
- `docs/extension-registry-service.md` – this document.

## Service Overview
- **Base URL:** `http://localhost:4400`
- **Health:** `GET /healthz`
- **Catalog:** `GET /v1/extensions?tag=ui&provider=autowrx-labs`
- **Detail:** `GET /v1/extensions/{extensionId}`
- **Version:** `GET /v1/extensions/{extensionId}/versions/{version}` (use `latest` for the newest released version).
- **Draft Upload:** `POST /v1/extensions/{extensionId}/versions` (accepts manifest metadata payload).
- **Release:** `POST /v1/extensions/{extensionId}/versions/{version}/release`

> ⚠️ Authentication is not implemented in the prototype; all endpoints are open for rapid iteration. Do not expose this service publicly without hardening.

## Example Payloads

### Catalog List
```json
{
  "items": [
    {
      "id": "weather-insights",
      "providerId": "autowrx-labs",
      "name": "Weather Insights",
      "summary": "Adds live weather widgets for vehicle journeys.",
      "description": "Visualize weather-aware driving recommendations inside AutoWRX.",
      "tags": ["ui", "telemetry"],
      "latestVersion": "1.1.0"
    }
  ]
}
```

### Version Detail
```json
{
  "version": "1.1.0",
  "state": "released",
  "bundleUrl": "https://cdn.autowrx.dev/extensions/weather-insights/1.1.0/main.js",
  "integrity": "sha256-PLACEHOLDER",
  "permissions": ["vehicle:read", "dom:read"],
  "engine": { "autowrx": "^2.0.0" },
  "manifest": { "id": "weather-insights", "main": "main.js", "activationEvents": ["onStartup"], "tabs": [...] }
}
```

## Running the Prototype
```bash
cd registry-service
npm install
npm run dev
```

A `.env.example` file is provided. Copy it to `.env` to customize the port or environment settings.

## Integration Notes
- Backend/frontend consumers can start replacing local catalog reads with requests to this service.
- Remaining tasks include response signing, asset storage integration, and authentication middleware.
- During migration, support dual-mode loaders (registry first, fallback to local filesystem).

## Roadmap Alignment
This service fulfills the Phase 2 requirements to:
- Expose the registry API contract.
- Supply a realistic catalog and version detail for the new dynamic loader.
- Provide entry points for publish workflows (draft, release) to be wired to provider tooling later.

Future phases will harden the service with persistent storage, signing, sandbox directives, and governance features.
