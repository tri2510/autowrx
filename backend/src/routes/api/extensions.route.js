const express = require('express');
const httpStatus = require('http-status');
const extensionRegistryService = require('../../services/extensionRegistry.service');

const router = express.Router();

function ensureConfigured(req, res, next) {
  if (!extensionRegistryService.isConfigured()) {
    return res.status(httpStatus.SERVICE_UNAVAILABLE).json({
      error: 'Extension registry is not configured'
    });
  }
  return next();
}

router.get('/catalog', ensureConfigured, async (req, res, next) => {
  try {
    const items = await extensionRegistryService.fetchCatalog(req.query || {});
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get('/:extensionId', ensureConfigured, async (req, res, next) => {
  try {
    const extension = await extensionRegistryService.fetchExtension(req.params.extensionId);
    if (!extension) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'Extension not found' });
    }
    res.json(extension);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'Extension not found' });
    }
    next(error);
  }
});

router.get('/:extensionId/versions/:version', ensureConfigured, async (req, res, next) => {
  try {
    const version = await extensionRegistryService.fetchExtensionVersion(req.params.extensionId, req.params.version);
    if (!version) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'Version not found' });
    }
    res.json(version);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'Version not found' });
    }
    next(error);
  }
});

module.exports = router;
