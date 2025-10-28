# Extension Center (Local Plugin Marketplace)

The `252-research-extension-strategies` branch now ships with a self-hosted extension center that lets your team publish, review, install, and iterate on AutoWRX plugins entirely offline. It is designed to run in the isolated environment first, so you can validate the integration before promoting the same flow to production.

## Components at a Glance

- **Registry service (`backend/src/services/pluginRegistry.service.js`)** – persists plugin catalog metadata, stores uploaded bundles, and exposes install/uninstall actions through `/api/plugins` routes.
- **Static distribution (`backend/src/app.js`)** – serves installed plugin assets under `/plugins-runtime/<pluginId>` so the frontend loader can fetch manifests and module bundles on demand.
- **Extension Center UI (`frontend/src/pages/ExtensionCenter.tsx`)** – provides catalog browsing, install/remove buttons, and bundle uploads directly within the AutoWRX shell.
- **Plugin manager enhancements (`frontend/src/core/plugin-manager.ts`)** – synchronises with the backend registry, loads installed plugins dynamically, and supports upload → install workflows programmatically.
- **Demo marketplace entry (`plugins/marketplace/weather-insights`)** – a ready-to-install sample plugin that illustrates the round trip and acts as a template for future submissions.

## Quick Start

1. Launch the isolated stack (from repository root):
   ```bash
   ./start-autowrx.sh
   ```

2. Visit the Extension Center at <http://localhost:3210/extensions>. The catalog initially lists the **Weather Insights** plugin.

3. Click **Install** on the Weather Insights card. The backend copies the plugin into `runtime/plugin-registry/installed/weather-insights`, and the frontend loads the new tab. Open the **Weather Insights** tab to confirm the plugin renders.

4. (Optional) Upload a new plugin bundle:
   - Zip a directory containing `manifest.json` plus your plugin code (see sample in `plugins/marketplace/weather-insights`).
   - Use **Upload Plugin Bundle** in the Extension Center; the registry stores the archive in `runtime/plugin-registry/packages/<pluginId>` and the plugin becomes installable immediately.

5. Remove an installed plugin using **Remove** in the Installed section. The runtime copy is deleted and any registered tabs are detached.

## Registry Storage Layout

All registry artefacts live under `runtime/plugin-registry` (ignored by git except for `catalog.json` and `.gitkeep` placeholders):

- `catalog.json` – curated list of plugins with their distribution source. Edit this file to add pre-approved entries pointing to local folders, zip URLs, or uploaded bundles.
- `installed/` – runtime copies served to the frontend under `/plugins-runtime/<id>`.
- `packages/` – extracted uploads awaiting review or reuse.
- `tmp/` – transient upload workspace (cleared automatically).

These directories are created automatically; no manual permissions are required inside the repo workspace.

## Plugin Packaging Expectations

A plugin bundle must contain:

- `manifest.json` with `id`, `name`, `version`, `description`, `author`, and `main` fields. Tabs declared in `manifest.tabs` are automatically registered when the plugin activates.
- The entry module referenced by `main` exporting a class implementing `activate()`, `deactivate()`, and `getComponent(name)`.
- Optional assets (images, styles) referenced from your code – the entire folder is served statically once installed.

The sample plugin demonstrates how to:

- Register a new tab via `window.AutoWRXPluginAPI.registerTab`.
- Render React components using the global `React` handle exposed by the host.
- Navigate back to the Extension Center with `pluginAPI.navigate('/extensions')`.

## API Summary

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/plugins/catalog` | GET | Return the curated catalog (id, metadata, status). |
| `/api/plugins/installed` | GET | List currently installed plugins with manifest and base URL. |
| `/api/plugins/install` | POST | Install a plugin from the catalog (`{ "id": "pluginId" }`). |
| `/api/plugins/upload` | POST (multipart) | Upload a ZIP bundle (`plugin` field). Auto-registers in the catalog and installs it. |
| `/api/plugins/:pluginId` | DELETE | Uninstall a plugin and remove runtime assets. |

## Adapting for Production

- Swap the filesystem-backed registry for database storage and object storage (S3, MinIO) in `pluginRegistry.service.js` while keeping the route contracts intact.
- Harden upload validation (signature checks, schema validation, antivirus scanning).
- Enrich catalog entries with approval states and surface them in the UI (status badges already render when provided).
- Extend the frontend install flow with role-based access and audit logging hooks.

## Troubleshooting

- **Plugin fails to load** – inspect `logs/backend.log` and the browser console. The registry logs missing manifests and the loader reports evaluation errors.
- **Upload rejected** – ensure the ZIP contains `manifest.json` with a unique `id`. Temporary artefacts are cleaned automatically after each attempt.
- **Tabs not appearing** – confirm the plugin’s `activate()` registers a tab and that `manifest.tabs` includes the matching component key.

With this foundation you can iterate on an internal marketplace quickly, then migrate the filesystem-backed registry to your production architecture when ready.
