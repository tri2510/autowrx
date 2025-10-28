const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const pluginRegistryService = require('../services/pluginRegistry.service');

exports.getCatalog = catchAsync(async (req, res) => {
  const plugins = await pluginRegistryService.getCatalog();
  res.status(httpStatus.OK).json({ plugins });
});

exports.getInstalled = catchAsync(async (req, res) => {
  const plugins = await pluginRegistryService.listInstalledPlugins();
  res.status(httpStatus.OK).json({ plugins });
});

exports.installFromCatalog = catchAsync(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Plugin "id" is required');
  }

  const result = await pluginRegistryService.installFromCatalog(id);
  res.status(httpStatus.OK).json({ plugin: result });
});

exports.uploadPlugin = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Plugin archive is required');
  }

  const result = await pluginRegistryService.registerUploadedPlugin(req.file.path, req.file.originalname);
  res.status(httpStatus.CREATED).json({ plugin: result });
});

exports.uninstallPlugin = catchAsync(async (req, res) => {
  const { pluginId } = req.params;
  if (!pluginId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'pluginId is required');
  }

  await pluginRegistryService.uninstallPlugin(pluginId);
  res.status(httpStatus.NO_CONTENT).send();
});

exports.updatePlugin = catchAsync(async (req, res) => {
  const { pluginId } = req.params;
  if (!pluginId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'pluginId is required');
  }

  const plugin = await pluginRegistryService.updateInstalledPlugin(pluginId, req.body || {});
  res.status(httpStatus.OK).json({ plugin });
});
