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
 * Fetches steam level of user
 * @param {string} steamId - steam id of user
 * @param {string} apiKey - steam api key
 * @returns {Promise<number>} - steam level
 */
const fetchSteamLevel = async (steamId, apiKey) => {
	const response = await fetch(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`);
	const data = await returnFetchResponse(response);

	const playerLevel = data?.response?.player_level;
	assert(typeof playerLevel === 'number', 'There was an error fetching your steam level.');

	return playerLevel || 0;
};

/**
 * Fetch steam profile of a user
 * @param {string} steamId - steam id 64 of the user
 * @param {string} apiKey - steam api key
 * @returns {object} the users steam profile
 */
const fetchSteamProfile = async (steamId, apiKey) => {
	const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`);
	const data = await returnFetchResponse(response);

	const profile = data?.response?.players?.find(profile => profile.steamid === steamId);
	assert(profile, 'There was an error fetching your steam profile.');

	return profile;
};

module.exports = {
	fetchSteamLevel,
	fetchSteamProfile
};