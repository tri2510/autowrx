#!/usr/bin/env node

// Simple script to check if development environment is set up correctly
// Run with: node check-dev-setup.js

const https = require('https');
const http = require('http');

// Configuration from .env file
const DEV_EMAIL = 'dev@autowrx.local';
const DEV_PASSWORD = 'dev123';
const BACKEND_URL = 'http://localhost:8080';

console.log('🔍 Checking AutoWRX Development Setup\n');
console.log('Configuration:');
console.log(`📧 Email: ${DEV_EMAIL}`);
console.log(`🔗 Backend: ${BACKEND_URL}`);
console.log('');

// Function to make HTTP request
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonBody,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkBackend() {
  console.log('1️⃣ Checking backend connection...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Backend is running and healthy');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } else {
      console.log(`⚠️ Backend responded with status: ${response.status}`);
      console.log('   Backend might be running but health endpoint not available');
    }
  } catch (error) {
    console.error('❌ Backend connection failed');
    console.error(`   Error: ${error.message}`);
    console.log('   Make sure the backend server is running on port 8080');
    console.log('   Try: cd backend-core && npm run dev');
    return false;
  }
  
  console.log('');
  return true;
}

async function checkLoginEndpoint() {
  console.log('2️⃣ Checking login endpoint...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/auth/login`, 'POST', {
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });
    
    console.log(`📝 Login response status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Login successful');
      console.log(`   User: ${response.data.user?.name || 'N/A'}`);
      console.log(`   Email: ${response.data.user?.email || 'N/A'}`);
      console.log(`   Access token: ${response.data.access ? 'Received' : 'Missing'}`);
      return true;
    } else if (response.status === 401) {
      console.log('❌ Authentication failed - invalid credentials');
      console.log('   The dev user might not exist or password is incorrect');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    } else if (response.status === 404) {
      console.log('❌ Login endpoint not found');
      console.log('   Backend might not have auth endpoints configured');
    } else {
      console.log(`❌ Unexpected response: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('❌ Login request failed');
    console.error(`   Error: ${error.message}`);
  }
  
  return false;
}

async function main() {
  const backendOk = await checkBackend();
  
  if (!backendOk) {
    console.log('\n❌ Development setup is not complete');
    console.log('\nTo fix:');
    console.log('1. Make sure backend-core is running');
    console.log('2. Check environment variables in .env');
    return;
  }
  
  const loginOk = await checkLoginEndpoint();
  
  if (!loginOk) {
    console.log('\n❌ Development user setup is not complete');
    console.log('\nTo fix:');
    console.log('1. Create the development user in your backend');
    console.log('2. Check that the credentials match');
    console.log('3. Verify auth endpoints are working');
    return;
  }
  
  console.log('\n✅ Development setup looks good!');
  console.log('The auto sign-in should work now.');
  console.log('If it still doesn\'t work, check the browser console for detailed logs.');
}

main().catch(console.error);