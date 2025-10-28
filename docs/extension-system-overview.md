# AutoWRX Extension System Overview

## Branch Context
- Branch: `252-research-extension-strategies`
- Focus: improve the plugin (extension) lifecycle so teams can install, configure, preview, and secure UI extensions without leaving the vehicle model workspace.

## Backend Enhancements
- `PATCH /api/plugins/:pluginId` adds manifest updates for installed plugins, rewrites `manifest.json`, refreshes catalog entries, and updates installation metadata.
- Robust manifest mutation logic handles textual fields, array fields (tags, permissions, activation events), and tab definitions (update existing or create new entries when `create` is true).
- Catalog metadata stays in sync via `addOrUpdateCatalogEntry`, preserving distribution channels when manifests change.
- Isolated environment scripts (`start-isolated.sh` / `stop-isolated.sh`) now start a production-like stack suitable for extension testing.

## Frontend Enhancements
- **Plugin Management Panel** (`PluginManagementPanel.tsx`): modal launched from the model detail page to install, upload, edit, or remove plugins in-context.
- **Plugin Workbench** (`PluginWorkbench.tsx`): dedicated route `/plugin-workbench/:pluginId` for live UI previews, manifest quick-links, reload controls, and tab metadata inspection.
- **Navigation updates**: routes include the workbench path; `PageModelDetail` exposes a "Manage Plugins" action and keeps plugin tabs in sync with the modal.
- **Runtime infrastructure**: loader, manager, and tab manager now persist via window singletons to survive HMR, expose debugging hooks, retain plugin base URLs, and provide explicit reload flows.
- **UI polish**: plugin tabs render correctly within the model page without triggering router navigations; duplicate top-level rendering is suppressed on model routes.

## Developer Workflows
1. **Install or upload**: Use the management panel to trigger catalog installs or bundle uploads; backend handles extraction and catalog registration.
2. **Edit metadata**: Update titles, summaries, and tab definitions directly from the modal; changes persist to disk and reload in-app.
3. **Preview & iterate**: Access `/plugin-workbench/<pluginId>` to preview components, reload the runtime bundle, and inspect tab definitions.
4. **Hot reload**: Loader automatically enables hot reload in dev mode; `pluginManager.reloadPlugin()` refreshes a single plugin after manifest edits.
5. **Isolated runs**: `./start-isolated.sh` spins up backend + frontend with in-memory MongoDB and local auth, ideal for validating plugin flows without external dependencies.

## Security & Safety Notes
- Manifest edits bypass schema validation beyond basic field presence; malformed definitions may break tab rendering.
- Plugins retain full DOM access in the current architecture—treat third-party code as trusted or isolate it during review.
- Recommended backlog items: iframe sandboxing, granular DOM/network permissions, CSP headers, and runtime violation monitoring.

## Related Documentation
- `docs/extension-management-guide.md` — end-user workflow for managing plugins and using the workbench.
- `HOW_TO_ADD_PLUGINS.md` — baseline plugin authoring steps (still valid; pair with the new management guide).
