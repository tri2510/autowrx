// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User, Asset } = require('../models');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    function(request) {
      let token = null;
      if (request && request.cookies) {
        // First try access token cookie (for isolated mode)
        token = request.cookies[`${config.jwt.cookie.name}_access`];
        // Fallback to refresh token cookie (shouldn't be used for auth but as backup)
        if (!token) {
          token = request.cookies[config.jwt.cookie.name];
        }
      }
      return token;
    }
  ]),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    
    // In isolated mode, use local auth service
    if (process.env.AUTOWRX_ISOLATED) {
      const localAuthService = require('../services/localAuth');
      const user = await localAuthService.getUserById(payload.sub);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    }
    
    // Normal mode - use database
    const user = await User.findById(payload.sub);
    if (user) {
      return done(null, user);
    }
    const asset = await Asset.findById(payload.sub);
    if (asset) {
      return done(null, asset);
    }
    return done(null, false);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
  jwtVerify,
};
