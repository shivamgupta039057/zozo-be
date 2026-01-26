const axios = require('axios');

/**
 * Generic GET request wrapper for Facebook Graph API or any HTTP GET.
 * @param {string} url - The full URL to call.
 * @param {object} [params] - Optional query parameters as an object.
 * @param {object} [headers] - Optional headers as an object.
 * @returns {Promise<any>} - The response data.
 */
async function getRequest(url, params = {}, headers = {}) {
  try {
    const response = await axios.get(url, {
      params,
      headers,
    });
    return response.data;
  } catch (error) {
    // Forward error message for service/controller to handle
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

module.exports = {
  getRequest,
};