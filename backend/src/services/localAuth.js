// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const bcrypt = require('bcryptjs');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');

/**
 * Local authentication service for isolated development
 * Mimics production authentication without external dependencies
 */
class LocalAuthService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.initializeDefaultUsers();
  }

  /**
   * Initialize default users for development
   */
  initializeDefaultUsers() {
    const config = require('../config/config');
    
    // Create admin users
    if (config.adminEmails && config.adminPassword) {
      config.adminEmails.forEach((email, index) => {
        const userId = new mongoose.Types.ObjectId();
        this.users.set(email, {
          _id: userId,
          id: userId.toString(),
          email: email,
          name: `Admin User ${index + 1}`,
          role: 'admin',
          isEmailVerified: true,
          password: bcrypt.hashSync(config.adminPassword, 8),
          createdAt: new Date(),
          permissions: ['*'] // All permissions
        });
      });
    }

    // Create test users
    const testUsers = [
      {
        email: 'user@autowrx.local',
        name: 'Test User',
        role: 'user',
        password: 'password123'
      },
      {
        email: 'dev@autowrx.local', 
        name: 'Developer',
        role: 'developer',
        password: 'dev123'
      }
    ];

    testUsers.forEach((userData, index) => {
      const userId = new mongoose.Types.ObjectId();
      this.users.set(userData.email, {
        _id: userId,
        id: userId.toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isEmailVerified: true,
        password: bcrypt.hashSync(userData.password, 8),
        createdAt: new Date(),
        permissions: userData.role === 'admin' ? ['*'] : ['read', 'write']
      });
    });

    console.log('🔐 Local Auth Service initialized with test users');
    console.log('📧 Available users:');
    this.users.forEach((user, email) => {
      console.log(`   - ${email} (${user.role})`);
    });
  }

  /**
   * Authenticate user with email and password
   */
  async login(email, password) {
    const user = this.users.get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }

    const sanitizedUser = this.sanitizeUser(user);
    // Generate simple tokens without database storage for isolated mode
    const tokens = this.generateSimpleTokens(sanitizedUser);
    
    return { user: sanitizedUser, tokens };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        return this.sanitizeUser(user);
      }
    }
    return null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const user = this.users.get(email);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, name, role = 'user' } = userData;

    if (this.users.has(email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    const userId = new mongoose.Types.ObjectId();
    const hashedPassword = bcrypt.hashSync(password, 8);

    const user = {
      _id: userId,
      id: userId.toString(),
      email,
      name,
      role,
      isEmailVerified: true, // Auto-verify in isolated mode
      password: hashedPassword,
      createdAt: new Date(),
      permissions: role === 'admin' ? ['*'] : ['read', 'write']
    };

    this.users.set(email, user);
    
    const sanitizedUser = this.sanitizeUser(user);
    const tokens = this.generateSimpleTokens(sanitizedUser);
    
    return { user: sanitizedUser, tokens };
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    const refreshTokenDoc = await Token.findOne({
      token: refreshToken,
      type: tokenTypes.REFRESH,
      blacklisted: false,
    });
    
    if (refreshTokenDoc) {
      await refreshTokenDoc.remove();
    }
  }

  /**
   * Refresh auth tokens
   */
  async refreshAuth(refreshToken) {
    try {
      const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
      const user = await this.getUserById(refreshTokenDoc.user);
      if (!user) {
        throw new Error();
      }
      await refreshTokenDoc.remove();
      return tokenService.generateAuthTokens(user);
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
  }

  /**
   * Generate password reset token
   */
  async forgotPassword(email) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
    }
    const resetPasswordToken = await tokenService.generateResetPasswordToken(email);
    // In isolated mode, just log the token instead of sending email
    console.log(`🔐 Password reset token for ${email}: ${resetPasswordToken}`);
    return resetPasswordToken;
  }

  /**
   * Reset password
   */
  async resetPassword(resetPasswordToken, newPassword) {
    try {
      const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
      const user = this.users.get(resetPasswordTokenDoc.user);
      if (!user) {
        throw new Error();
      }
      user.password = bcrypt.hashSync(newPassword, 8);
      await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(verifyEmailToken) {
    try {
      const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
      const user = this.users.get(verifyEmailTokenDoc.user);
      if (!user) {
        throw new Error();
      }
      user.isEmailVerified = true;
      await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
    }
  }

  /**
   * Generate simple JWT tokens for isolated mode
   */
  generateSimpleTokens(user) {
    const jwt = require('jsonwebtoken');
    const moment = require('moment');
    const config = require('../config/config');

    const payload = {
      sub: user._id.toString(),
      iat: moment().unix(),
      type: 'access'
    };

    const accessTokenExpires = moment().add(config.jwt.accessExpirationValue, config.jwt.accessExpirationUnit);
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: `${config.jwt.accessExpirationValue}${config.jwt.accessExpirationUnit.charAt(0)}`
    });

    const refreshPayload = { ...payload, type: 'refresh' };
    const refreshToken = jwt.sign(refreshPayload, config.jwt.secret, {
      expiresIn: `${config.jwt.refreshExpirationDays}d`
    });

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate()
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate()
      }
    };
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    if (!user) return null;
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Check if user has permission
   */
  hasPermission(user, permission) {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('*') || user.permissions.includes(permission);
  }

  /**
   * List all users (admin only)
   */
  async getAllUsers() {
    return Array.from(this.users.values()).map(user => this.sanitizeUser(user));
  }

  /**
   * Authenticate method for controllers (matches authService interface)
   */
  async authenticate(user) {
    return { user: this.sanitizeUser(user) };
  }

  /**
   * Login with email/password for controllers
   */
  async loginWithEmailAndPassword(email, password) {
    return this.login(email, password);
  }

  /**
   * Login with email/password (exact method name from auth.service.js)
   * This should return only the user, not { user, tokens }
   */
  async loginUserWithEmailAndPassword(email, password) {
    const user = this.users.get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Register user for controllers  
   */
  async registerUser(userData) {
    return this.register(userData);
  }
}

// Export singleton instance
module.exports = new LocalAuthService();