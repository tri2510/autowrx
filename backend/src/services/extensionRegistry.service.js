const axios = require('axios');
const config = require('../config/config');

const baseUrl = config.integrations?.extensionRegistry?.baseUrl || '';

let client = null;

function getClient() {
  if (!baseUrl) {
    throw new Error('Extension registry base URL is not configured');
  }
  if (!client) {
    client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: {
        'User-Agent': 'AutoWRX-Backend/registry-proxy'
      }
    });
  }
  return client;
}

async function fetchCatalog(query = {}) {
  const http = getClient();
  const response = await http.get('/v1/extensions', { params: query });
  return response.data?.items || [];
}

async function fetchExtension(extensionId) {
  const http = getClient();
  const response = await http.get(`/v1/extensions/${extensionId}`);
  return response.data;
}

async function fetchExtensionVersion(extensionId, version = 'latest') {
  const http = getClient();
  const response = await http.get(`/v1/extensions/${extensionId}/versions/${version}`);
  return response.data;
}

module.exports = {
  isConfigured: () => Boolean(baseUrl),
  fetchCatalog,
  fetchExtension,
  fetchExtensionVersion
};
