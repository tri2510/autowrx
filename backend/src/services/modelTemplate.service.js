// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { ModelTemplate } = require('../models');
const ApiError = require('../utils/ApiError');

const create = async (body) => {
  return ModelTemplate.create(body);
};

const query = async (filter, options) => {
  return ModelTemplate.paginate(filter, options);
};

const getById = async (id) => ModelTemplate.findById(id);

const updateById = async (id, updateBody) => {
  const doc = await getById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'ModelTemplate not found');
  Object.assign(doc, updateBody);
  await doc.save();
  return doc;
};

const removeById = async (id) => {
  const doc = await getById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'ModelTemplate not found');
  await doc.deleteOne();
  return doc;
};

module.exports = { create, query, getById, updateById, removeById };


