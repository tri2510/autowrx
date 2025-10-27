const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

async function startDevServer() {
  try {
    console.log('🚀 Starting AutoWRX development environment...');
    
    // Start in-memory MongoDB
    console.log('📦 Starting MongoDB in-memory server...');
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        ip: '127.0.0.1',
        dbName: 'autowrx'
      }
    });
    
    const uri = mongod.getUri();
    console.log(`✅ MongoDB running at: ${uri}`);
    
    // Update environment
    process.env.MONGODB_URL = uri;
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3200';
    process.env.JWT_SECRET = 'dev_secret_change_me';
    process.env.STRICT_AUTH = 'false';
    
    // Start the main app
    console.log('🌐 Starting AutoWRX backend server...');
    require('./src/index.js');
    
  } catch (error) {
    console.error('❌ Failed to start development server:', error);
    process.exit(1);
  }
}

startDevServer();