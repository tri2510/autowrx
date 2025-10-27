// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * AutoWRX Isolated Development Server
 * Production-like environment without external dependencies
 */

// Override config for isolated mode BEFORE loading any modules
process.env.NODE_ENV = 'production'; // Use production settings
process.env.STRICT_AUTH = 'false';   // Disable strict auth
process.env.AUTOWRX_ISOLATED = 'true'; // Flag for isolated mode

// Load isolated environment variables - this will override any existing ones
require('dotenv').config({ 
  path: require('path').join(__dirname, '.env.isolated'),
  override: true  // Override existing environment variables
});

// Ensure AUTH_URL and EMAIL_URL are truly unset for local auth
delete process.env.AUTH_URL;
delete process.env.EMAIL_URL;

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Use isolated config instead of regular config
const config = require('./src/config/config.isolated');
const logger = require('./src/config/logger');

// Load app after config is set
const app = require('./src/app');

let mongod;
let server;

const startIsolatedServer = async () => {
  try {
    console.log('🚀 Starting AutoWRX Isolated Development Environment');
    console.log('='.repeat(60));

    // Start in-memory MongoDB
    console.log('📦 Starting in-memory MongoDB...');
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        ip: '127.0.0.1',
        dbName: 'autowrx-isolated'
      }
    });

    const mongoUri = mongod.getUri();
    console.log(`✅ MongoDB started: ${mongoUri}`);

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Initialize local auth service
    const localAuthService = require('./src/services/localAuth');
    console.log('✅ Local authentication service initialized');

    // The isolated environment uses the existing route structure
    // but with local authentication service instead of external auth
    console.log('✅ Using existing route structure with local auth service');

    // Start the server
    server = app.listen(config.port, () => {
      console.log('✅ Server started successfully');
      console.log('');
      console.log('🎯 AutoWRX Isolated Environment Ready!');
      console.log('='.repeat(60));
      console.log(`🌐 Backend URL: http://localhost:${config.port}`);
      console.log(`🔗 Frontend URL: http://localhost:3210`);
      console.log('');
      console.log('👤 Test Users Available:');
      console.log('   📧 admin@autowrx.local   🔑 AutoWRX2025!   (admin)');
      console.log('   📧 dev@autowrx.local     🔑 AutoWRX2025!   (admin)');
      console.log('   📧 user@autowrx.local    🔑 password123    (user)');
      console.log('');
      console.log('🔌 Plugin System: Fully functional');
      console.log('🗄️  Database: In-memory MongoDB (isolated)');
      console.log('🔐 Authentication: Local service (no external deps)');
      console.log('📧 Email: Disabled (console logging only)');
      console.log('🌍 External APIs: Disabled (fully isolated)');
      console.log('');
      console.log('🧪 Test Endpoints:');
      console.log(`   POST http://localhost:${config.port}/v2/auth/login`);
      console.log(`   GET  http://localhost:${config.port}/v2/auth/status`);
      console.log(`   GET  http://localhost:${config.port}/v2/users/self`);
      console.log('');
      console.log('📋 Mode: ISOLATED PRODUCTION-LIKE DEVELOPMENT');
      console.log('✅ Ready for development and testing!');
    });

  } catch (error) {
    console.error('❌ Failed to start isolated server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down AutoWRX Isolated Environment...');
  
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ Server closed');
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ MongoDB disconnected');
    }

    if (mongod) {
      await mongod.stop();
      console.log('✅ In-memory MongoDB stopped');
    }

    console.log('✅ Isolated environment shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the server
startIsolatedServer();