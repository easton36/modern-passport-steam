const assert = require('assert');

/**
 * Fetches steam level of user
 * @param {string} steamId - steam id of user
 * @param {string} apiKey - steam api key
 * @returns {Promise<number>} - steam level
 */
const fetchSteamLevel = async (steamId, apiKey) => {
	const response = await fetch(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`);
	const data = await response.json();

	const playerLevel = data?.response?.player_level;
	assert(playerLevel, 'Steam profile is probably private');

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
	const data = await response.json();

	const profile = data?.response?.players?.find(profile => profile.steamid === steamId);
	assert(profile, 'There was an error fetching your steam profile.');

	return profile;
};

module.exports = {
	fetchSteamLevel,
	fetchSteamProfile
};