// Test script to reproduce the auth flow issue
import axios from 'axios';

const BASE_URL = 'https://backend-core-dev.digital.auto/v2';
const EMAIL = '';
const PASSWORD = '';

async function testAuthFlow() {
  console.log('=== Testing Auth Flow ===\n');
  
  // Step 1: Login
  console.log('Step 1: Login...');
  try {
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/login`,
      { email: EMAIL, password: PASSWORD },
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000',
          'Referer': 'http://localhost:3000/'
        }
      }
    );
    
    console.log('✓ Login successful');
    console.log('Response status:', loginResponse.status);
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
    
    // Extract cookies from response
    const setCookieHeader = loginResponse.headers['set-cookie'];
    console.log('\nCookies received:');
    if (setCookieHeader) {
      setCookieHeader.forEach(cookie => {
        console.log('  -', cookie.split(';')[0]);
      });
    }
    
    // Extract the refresh token cookie
    let refreshTokenCookie = null;
    if (setCookieHeader) {
      const tokenCookie = setCookieHeader.find(c => c.startsWith('token-shared='));
      if (tokenCookie) {
        refreshTokenCookie = tokenCookie.split(';')[0];
        console.log('\nExtracted refresh token cookie:', refreshTokenCookie);
      }
    }
    
    console.log('\n---\n');
    
    // Step 2: Refresh tokens
    console.log('Step 2: Refresh tokens...');
    
    if (!refreshTokenCookie) {
      console.error('✗ No refresh token cookie found in login response');
      return;
    }
    
    try {
      const refreshResponse = await axios.post(
        `${BASE_URL}/auth/refresh-tokens`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Cookie': refreshTokenCookie,
            'Origin': 'http://localhost:3000',
            'Referer': 'http://localhost:3000/'
          }
        }
      );
      
      console.log('✓ Refresh tokens successful');
      console.log('Response status:', refreshResponse.status);
      console.log('Response data:', JSON.stringify(refreshResponse.data, null, 2));
      
    } catch (refreshError) {
      console.error('✗ Refresh tokens failed');
      if (refreshError.response) {
        console.error('Status:', refreshError.response.status);
        console.error('Response data:', refreshError.response.data);
        console.error('Response headers:', refreshError.response.headers);
      } else {
        console.error('Error:', refreshError.message);
      }
    }
    
  } catch (loginError) {
    console.error('✗ Login failed');
    if (loginError.response) {
      console.error('Status:', loginError.response.status);
      console.error('Response data:', loginError.response.data);
    } else {
      console.error('Error:', loginError.message);
    }
  }
}

testAuthFlow();
