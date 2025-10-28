# Extension Management Guide

Use this guide to exercise the new extension tooling shipped on `252-research-extension-strategies`.

## Prerequisites
- AutoWRX repository cloned and dependencies installed (`backend/` and `frontend/`).
- Optional but recommended: run `./start-isolated.sh` for a production-like environment with local auth and in-memory MongoDB.
- Browser access to the frontend host (default `http://localhost:3210` when using the isolated script).

## Launching the Isolated Stack
1. From the repository root run `./start-isolated.sh`.
2. Wait for the script to report backend (`http://localhost:3200`) and frontend (`http://localhost:3210`) URLs.
3. When finished, stop the environment with `./stop-isolated.sh`.

## Using the Plugin Management Panel
1. Navigate to `/model/bmw-x3-2024` (or any model detail page).
2. Click **Manage Plugins** in the header; the modal lists installed plugins and, optionally, the catalog.
3. **Install from catalog**: select **Install from Catalog**, choose a plugin, and click **Install**. The UI triggers `/api/plugins/install` and refreshes the runtime.
4. **Upload bundle**: choose **Upload Bundle** and select a `.zip`. The backend extracts, registers, and exposes the plugin through the catalog before installation.
5. **Edit metadata**: select a plugin, click **Edit Metadata**, adjust fields (name, summary, description) or tab definitions (label, icon, path, component, position). Save to issue a `PATCH /api/plugins/:pluginId` and automatic reload.
6. **Remove**: click **Remove** to uninstall; the tab manager unloads the plugin and cleans up manifest storage.

## Working in the Plugin Workbench
1. From the management panel, click **Develop GUI** (or navigate directly to `/plugin-workbench/<pluginId>`). Registry plugins are restored automatically between sessions when integrity checks succeed.
2. Use the **Live Preview** select to switch between tab components defined in `manifest.json`.
3. Press **Reload Plugin** after editing source files; this calls `pluginManager.reloadPlugin()` and reinitializes the runtime bundle.
4. Use **View Manifest** for quick inspection of the active manifest, or **Manage Plugins** to jump back to the modal.

## Updating Manifests via API
- REST call: `PATCH /api/plugins/:pluginId` with a JSON body matching `PluginUpdateRequest` (see `frontend/src/services/pluginMarketplace.service.ts`).
- Supported fields: `name`, `description`, `summary`, `version`, `author`, `tags`, `permissions`, `activationEvents`, and `tabs`.
- Tabs array: provide `id` and optional fields (`label`, `icon`, `path`, `component`, `position`, `permissions`). Include `create: true` if you want to append a new tab entry. Missing required fields (`label`, `path`, `component`) are ignored on creation.

## Testing & Troubleshooting
- **Reload stalls**: ensure no duplicate Node process is holding port 3200 (`lsof -i :3200`). Use `./stop-isolated.sh` to clean up, then restart.
- **Tabs not updating**: confirm the manifest `id` matches the installed plugin directory; the manager indexes by `id` and `baseUrl`.
- **Catalog missing entries**: after uploading a bundle, the backend writes to `backend/runtime/plugin-registry/catalog.json`. Check logs for validation errors.
- **Security reminder**: plugins run with full DOM access today; review source code for untrusted bundles and consider sandboxing before production deployment.

## References
- `docs/extension-system-overview.md` — architecture-level summary.
- `HOW_TO_ADD_PLUGINS.md` — authoring guide for new plugins.
- `AUTOWRX_PLUGIN_SYSTEM_COMPLETE.md` — canonical plugin system reference.
