// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const httpStatus = require('http-status');
const localAuthService = require('../../services/localAuth');
const localAuth = require('../../middlewares/localAuth');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

/**
 * Local authentication routes for isolated development
 * Provides production-like authentication without external dependencies
 */

// POST /v2/auth/login
router.post('/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email and password are required');
  }

  const result = await localAuthService.login(email, password);
  
  // Set token cookie
  const config = require('../../config/config');
  res.cookie(config.jwt.cookie.name, result.tokens.access.token, {
    ...config.jwt.cookie.options,
    expires: result.tokens.access.expires,
  });

  res.status(httpStatus.OK).json({
    user: result.user,
    tokens: result.tokens,
  });
}));

// POST /v2/auth/register
router.post('/register', catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  
  if (!email || !password || !name) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email, password, and name are required');
  }

  const result = await localAuthService.register({ email, password, name, role });
  
  // Set token cookie
  const config = require('../../config/config');
  res.cookie(config.jwt.cookie.name, result.tokens.access.token, {
    ...config.jwt.cookie.options,
    expires: result.tokens.access.expires,
  });

  res.status(httpStatus.CREATED).json({
    user: result.user,
    tokens: result.tokens,
  });
}));

// POST /v2/auth/logout
router.post('/logout', localAuth(), catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  await localAuthService.logout(refreshToken);
  
  // Clear token cookie
  const config = require('../../config/config');
  res.clearCookie(config.jwt.cookie.name, config.jwt.cookie.options);
  
  res.status(httpStatus.NO_CONTENT).send();
}));

// POST /v2/auth/refresh-tokens
router.post('/refresh-tokens', catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  const tokens = await localAuthService.refreshAuth(refreshToken);
  
  // Update token cookie
  const config = require('../../config/config');
  res.cookie(config.jwt.cookie.name, tokens.access.token, {
    ...config.jwt.cookie.options,
    expires: tokens.access.expires,
  });

  res.status(httpStatus.OK).json({ tokens });
}));

// POST /v2/auth/forgot-password
router.post('/forgot-password', catchAsync(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is required');
  }

  const resetToken = await localAuthService.forgotPassword(email);
  
  res.status(httpStatus.OK).json({
    message: 'Password reset token generated (check console in isolated mode)',
    resetToken: resetToken // In isolated mode, return token directly for testing
  });
}));

// POST /v2/auth/reset-password
router.post('/reset-password', catchAsync(async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token and new password are required');
  }

  await localAuthService.resetPassword(token, password);
  
  res.status(httpStatus.OK).json({
    message: 'Password reset successfully'
  });
}));

// GET /v2/auth/verify-email
router.post('/verify-email', catchAsync(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Verification token is required');
  }

  await localAuthService.verifyEmail(token);
  
  res.status(httpStatus.OK).json({
    message: 'Email verified successfully'
  });
}));

// GET /v2/users/self - Get current user
router.get('/users/self', localAuth(), catchAsync(async (req, res) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
  
  res.status(httpStatus.OK).json({ user: req.user });
}));

// GET /v2/users - Get all users (admin only)
router.get('/users', localAuth(), catchAsync(async (req, res) => {
  if (!req.user || !localAuthService.hasPermission(req.user, 'manageUsers')) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  
  const users = await localAuthService.getAllUsers();
  res.status(httpStatus.OK).json({ users });
}));

// GET /v2/permissions/has-permission - Check user permissions
router.get('/permissions/has-permission', localAuth({ optional: true }), catchAsync(async (req, res) => {
  const { permissions } = req.query;
  
  if (!req.user) {
    return res.status(httpStatus.OK).json({ hasPermission: false });
  }

  const permissionsList = permissions ? permissions.split(',') : [];
  const hasPermission = permissionsList.every(permission => 
    localAuthService.hasPermission(req.user, permission)
  );
  
  res.status(httpStatus.OK).json({ hasPermission });
}));

// GET /v2/auth/status - Check authentication status
router.get('/status', localAuth({ optional: true }), catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json({
    authenticated: !!req.user,
    user: req.user || null,
    mode: 'isolated',
    message: 'AutoWRX Isolated Development Environment'
  });
}));

module.exports = router;