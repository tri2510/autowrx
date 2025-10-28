const path = require('path');
const fsPromises = require('fs/promises');
const fsExtra = require('fs-extra');
const AdmZip = require('adm-zip');

const repoRoot = path.join(__dirname, '../../..');
const registryRoot = path.join(repoRoot, 'runtime/plugin-registry');
const catalogPath = path.join(registryRoot, 'catalog.json');
const installedDir = path.join(registryRoot, 'installed');
const packagesDir = path.join(registryRoot, 'packages');
const uploadsDir = path.join(registryRoot, 'uploads');

const DEFAULT_CATALOG = {
  updatedAt: new Date().toISOString(),
  plugins: [
    {
      id: 'weather-insights',
      name: 'Weather Insights',
      version: '1.0.0',
      description: 'Visualize driving recommendations based on live weather data.',
      author: 'AutoWRX Labs',
      summary: 'Demo plugin showcasing dynamic tab registration with live data stubs.',
      tags: ['official', 'demo'],
      status: 'approved',
      homepage: 'https://digital.auto',
      distribution: {
        type: 'local-directory',
        path: 'plugins/marketplace/weather-insights'
      }
    }
  ]
};

async function ensureInitialized() {
  await fsExtra.ensureDir(registryRoot);
  await fsExtra.ensureDir(installedDir);
  await fsExtra.ensureDir(packagesDir);
  await fsExtra.ensureDir(uploadsDir);

  if (!(await fsExtra.pathExists(catalogPath))) {
    await fsExtra.writeJson(catalogPath, DEFAULT_CATALOG, { spaces: 2 });
  }
}

async function readCatalog() {
  await ensureInitialized();
  try {
    const data = await fsPromises.readFile(catalogPath, 'utf8');
    const catalog = JSON.parse(data);
    if (!Array.isArray(catalog.plugins)) {
      throw new Error('Invalid catalog format');
    }
    return catalog;
  } catch (error) {
    await fsExtra.writeJson(catalogPath, DEFAULT_CATALOG, { spaces: 2 });
    return DEFAULT_CATALOG;
  }
}

async function saveCatalog(catalog) {
  catalog.updatedAt = new Date().toISOString();
  await fsExtra.writeJson(catalogPath, catalog, { spaces: 2 });
}

function mapCatalogEntryForClient(entry) {
  const { distribution, ...rest } = entry;
  return {
    ...rest,
    distribution: {
      type: distribution?.type || 'unknown'
    }
  };
}

async function getCatalog() {
  const catalog = await readCatalog();
  return catalog.plugins.map((plugin) => mapCatalogEntryForClient(plugin));
}

async function listInstalledPlugins() {
  await ensureInitialized();
  const installed = [];
  const dirs = await safeReadDir(installedDir);

  for (const dirent of dirs) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const pluginPath = path.join(installedDir, dirent.name);
    try {
      const manifest = await readManifest(pluginPath);
      installed.push({
        id: manifest.id,
        manifest,
        baseUrl: `/plugins-runtime/${manifest.id}`,
        installedAt: await getInstalledTimestamp(pluginPath)
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to read manifest for installed plugin ${dirent.name}:`, error.message);
    }
  }

  return installed;
}

async function installFromCatalog(pluginId) {
  const catalog = await readCatalog();
  const entry = catalog.plugins.find((plugin) => plugin.id === pluginId);
  if (!entry) {
    throw new Error(`Plugin ${pluginId} not found in catalog`);
  }

  const sourcePath = await resolveDistributionSource(entry);
  const manifest = await readManifest(sourcePath);

  const destination = path.join(installedDir, manifest.id);
  await fsExtra.remove(destination);
  await fsExtra.ensureDir(path.dirname(destination));
  await fsExtra.copy(sourcePath, destination);

  await touchInstalledMetadata(destination);

  return {
    id: manifest.id,
    manifest,
    baseUrl: `/plugins-runtime/${manifest.id}`
  };
}

async function uninstallPlugin(pluginId) {
  const destination = path.join(installedDir, pluginId);
  if (!(await fsExtra.pathExists(destination))) {
    throw new Error(`Plugin ${pluginId} is not installed`);
  }
  await fsExtra.remove(destination);
}

async function registerUploadedPlugin(filePath, originalName) {
  await ensureInitialized();
  const extractionRoot = path.join(uploadsDir, `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fsExtra.ensureDir(extractionRoot);

  try {
    const zip = new AdmZip(filePath);
    zip.extractAllTo(extractionRoot, true);

    const { manifest, pluginRoot } = await findManifestRecursively(extractionRoot);
    if (!manifest) {
      throw new Error('manifest.json not found in uploaded archive');
    }
    if (!manifest.id) {
      throw new Error('Uploaded manifest must declare an "id" field');
    }

    const packageDestination = path.join(packagesDir, manifest.id);
    await fsExtra.remove(packageDestination);
    await fsExtra.ensureDir(path.dirname(packageDestination));
    await fsExtra.copy(pluginRoot, packageDestination);

    await addOrUpdateCatalogEntry(manifest, {
      distribution: {
        type: 'uploaded-directory',
        path: path.relative(repoRoot, packageDestination)
      },
      status: 'submitted',
      source: 'upload',
      originalName
    });

    return {
      manifest,
      baseUrl: null
    };
  } finally {
    await fsExtra.remove(extractionRoot);
    await fsExtra.remove(filePath);
  }
}

async function resolveDistributionSource(entry) {
  if (!entry.distribution || !entry.distribution.type) {
    throw new Error(`Plugin ${entry.id} missing distribution metadata`);
  }

  switch (entry.distribution.type) {
    case 'local-directory': {
      const relativePath = entry.distribution.path;
      const resolvedPath = path.resolve(repoRoot, relativePath);
      if (!(await fsExtra.pathExists(resolvedPath))) {
        throw new Error(`Local plugin directory not found: ${resolvedPath}`);
      }
      return resolvedPath;
    }
    case 'uploaded-directory': {
      const relativePath = entry.distribution.path || path.join('runtime/plugin-registry/packages', entry.id);
      const resolvedPath = path.resolve(repoRoot, relativePath);
      if (!(await fsExtra.pathExists(resolvedPath))) {
        throw new Error(`Uploaded plugin directory not found: ${resolvedPath}`);
      }
      return resolvedPath;
    }
    default:
      throw new Error(`Unsupported distribution type: ${entry.distribution.type}`);
  }
}

async function addOrUpdateCatalogEntry(manifest, overrides = {}) {
  const catalog = await readCatalog();
  const index = catalog.plugins.findIndex((plugin) => plugin.id === manifest.id);

  const baseEntry = {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    summary: manifest.summary || manifest.description,
    tabs: manifest.tabs?.length || 0,
    tags: manifest.tags || [],
    status: 'pending'
  };

  const merged = {
    ...(index !== -1 ? catalog.plugins[index] : baseEntry),
    ...baseEntry,
    ...overrides,
    distribution: {
      ...(index !== -1 ? catalog.plugins[index].distribution : {}),
      ...(overrides.distribution || {})
    },
    updatedAt: new Date().toISOString()
  };

  if (index === -1) {
    merged.createdAt = new Date().toISOString();
    catalog.plugins.push(merged);
  } else {
    catalog.plugins[index] = merged;
  }

  await saveCatalog(catalog);
  return merged;
}

async function readManifest(pluginPath) {
  const manifestPath = path.join(pluginPath, 'manifest.json');
  const manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
  return JSON.parse(manifestContent);
}

async function findManifestRecursively(startPath) {
  const manifestPath = path.join(startPath, 'manifest.json');
  if (await fsExtra.pathExists(manifestPath)) {
    const manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
    return {
      manifest: JSON.parse(manifestContent),
      pluginRoot: startPath
    };
  }

  const entries = await safeReadDir(startPath);
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const nested = await findManifestRecursively(path.join(startPath, entry.name));
    if (nested) {
      return nested;
    }
  }

  return { manifest: null, pluginRoot: null };
}

async function safeReadDir(directory) {
  try {
    return await fsPromises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function touchInstalledMetadata(pluginPath) {
  const metadataPath = path.join(pluginPath, '.autowrx.plugin.json');
  const metadata = {
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await fsExtra.writeJson(metadataPath, metadata, { spaces: 2 });
}

async function getInstalledTimestamp(pluginPath) {
  const metadataPath = path.join(pluginPath, '.autowrx.plugin.json');
  if (!(await fsExtra.pathExists(metadataPath))) {
    return null;
  }
  try {
    const data = await fsPromises.readFile(metadataPath, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.installedAt || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  ensureInitialized,
  getCatalog,
  listInstalledPlugins,
  installFromCatalog,
  uninstallPlugin,
  registerUploadedPlugin,
  getInstalledStaticPath: () => installedDir
};
