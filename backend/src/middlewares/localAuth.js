// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const passport = require('passport');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const localAuthService = require('../services/localAuth');
const logger = require('../config/logger');

/**
 * Local authentication middleware for isolated development
 * Works exactly like production but without external dependencies
 */
const localAuth = ({ optional = false } = {}) => async (req, res, next) => {
  try {
    let user;

    // If we're in isolated mode (no AUTH_URL), use local authentication
    if (!config.services.auth.url) {
      // Use passport JWT strategy for local authentication
      user = await new Promise((resolve, reject) => {
        passport.authenticate('jwt', { session: false }, (err, user, info) => {
          if (err) {
            return reject(err);
          }
          if (info || !user) {
            // If no user found but auth is optional, continue without user
            if (optional) {
              return resolve(null);
            }
            return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
          }
          resolve(user);
        })(req, res);
      });
    } else {
      // This would be the external auth service call (production mode)
      // For now, fallback to passport
      user = await new Promise((resolve, reject) => {
        passport.authenticate('jwt', { session: false }, (err, user, info) => {
          if (err || info || !user) {
            if (optional) return resolve(null);
            return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
          }
          resolve(user);
        })(req, res);
      });
    }

    // If user found, attach to request
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    if (optional) {
      next(); // Continue without user for optional auth
    } else {
      logger.error(`Local auth failed: ${error.message}`);
      next(error);
    }
  }
};

module.exports = localAuth;