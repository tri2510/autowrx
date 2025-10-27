// Test script for isolated environment login
const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testing Isolated Environment Login...');
    
    // Test status first
    const statusResponse = await axios.get('http://localhost:3200/v2/auth/status');
    console.log('📊 Status:', statusResponse.data);
    
    // Test login
    const loginData = {
      email: 'admin@autowrx.local',
      password: 'AutoWRX2025!'
    };
    
    console.log('🔐 Attempting login with:', loginData.email);
    const loginResponse = await axios.post('http://localhost:3200/v2/auth/login', loginData);
    
    console.log('✅ Login successful!');
    console.log('👤 User:', loginResponse.data.user);
    console.log('🎫 Token:', loginResponse.data.tokens.access.token.substring(0, 20) + '...');
    
    // Test authenticated endpoint
    const token = loginResponse.data.tokens.access.token;
    const userResponse = await axios.get('http://localhost:3200/v2/users/self', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Authenticated request successful!');
    console.log('👤 Authenticated user:', userResponse.data.user);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLogin();