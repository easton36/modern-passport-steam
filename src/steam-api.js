const assert = require('assert');

/**
 * Fetches response from a fetch request
 * @param {Response} response - response object
 * @returns {Promise<string|object>} - response data
 */
const returnFetchResponse = async (response) => {
	const contentType = response.headers.get('content-type');
	if(contentType && contentType.indexOf('application/json') !== -1) {
		return await response.json();
	} else{
		const text = await response.text();
		if(text?.includes('Access is denied.')) {
			throw new Error('Steam API key is invalid');
		}

		return text;
	}
};

/**
 * Fetch with retries on 429 status code
 * @param {string} url - resource URL
 * @param {object} options - fetch options
 * @param {number} retries - number of retry attempts on 429 (default: 3)
 * @param {number} backoff - initial backoff delay in ms (default: 300)
 * @returns {Promise<Response>} fetch response
 */
const fetchWithRetries = async (url, options = {}, retries = 3, backoff = 300) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, options);
    if (response.status !== 429) {
      return response;
    }
    // if not last attempt, wait before retrying
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, attempt)));
    }
  }
  // last attempt
  return await fetch(url, options);
};

/**
 * Fetches steam level of user
 * @param {string} steamId - steam id of user
 * @param {string} apiKey - steam api key
 * @returns {Promise<number>} - steam level
 */
const fetchSteamLevel = async (steamId, apiKey) => {
  const url = `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`;
  const response = await fetchWithRetries(url);
  const data = await returnFetchResponse(response);

  const playerLevel = data?.response?.player_level;

  return playerLevel || 0;
};

/**
 * Fetch steam profile of a user
 * @param {string} steamId - steam id 64 of the user
 * @param {string} apiKey - steam api key
 * @returns {object} the users steam profile
 */
const fetchSteamProfile = async (steamId, apiKey) => {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const response = await fetchWithRetries(url);
  const data = await returnFetchResponse(response);

  const profile = data?.response?.players?.find(profile => profile.steamid === steamId);
  assert(profile, 'There was an error fetching your steam profile.');

  return profile;
};

module.exports = {
  fetchWithRetries,
  fetchSteamLevel,
  fetchSteamProfile
};