const express = require('express');
const path = require('path');
const fsExtra = require('fs-extra');
const multer = require('multer');
const pluginRegistryController = require('../../controllers/pluginRegistry.controller');

const router = express.Router();

const uploadTempDir = path.join(__dirname, '../../..', 'runtime/plugin-registry/tmp');
fsExtra.ensureDirSync(uploadTempDir);

const upload = multer({
  dest: uploadTempDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

router.get('/catalog', pluginRegistryController.getCatalog);
router.get('/installed', pluginRegistryController.getInstalled);
router.post('/install', pluginRegistryController.installFromCatalog);
router.post('/upload', upload.single('plugin'), pluginRegistryController.uploadPlugin);
router.delete('/:pluginId', pluginRegistryController.uninstallPlugin);

module.exports = router;
