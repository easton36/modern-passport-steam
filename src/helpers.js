const axios = require('axios');
const assert = require('assert');
const SteamID = require('steamid');

const { REQUIRED_PARAMS, REQUIRED_SIGNED_PARAMS } = require('./constants');

/**
 * Canonicalizes a realm URL
 * @param {String} realm - The realm to canonicalize
 * @returns {String} The canonicalized realm
 */
function canonicalizeRealm(realm){
	const match = realm.match(/^(https?:\/\/[^:/]+)/);
	assert(match, `"${realm}" does not appear to be a valid realm`);

	return match[1].toLowerCase();
}

/**
 * Builds an authentication URL for Steam OpenID
 * @param {String} realm - The realm to build the auth URL for
 * @param {String} returnUrl - The URL to return to after authentication
 * @returns {String} The built authentication URL
 */
function buildAuthUrl(realm, returnUrl){
	const query = {
		'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
		'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
		'openid.mode': 'checkid_setup',
		'openid.ns': 'http://specs.openid.net/auth/2.0',
		'openid.realm': realm,
		'openid.return_to': returnUrl
	};

	return 'https://steamcommunity.com/openid/login?' + new URLSearchParams(query).toString();
};

/**
 * Builds the query object from parsed URL
 * @param {URL} parsedUrl - The parsed URL object
 * @returns {Object} The built query object
 * @throws {Error} If the query cannot be built or verified
 */
function buildQuery(parsedUrl){
	const query = {};

	// Ensure all required parameters are present and signed
	REQUIRED_PARAMS.forEach(param => {
		assert(parsedUrl.searchParams.has(`openid.${param}`), `No "${param}" parameter is present in the URL`);

		query[param] = parsedUrl.searchParams.get(param);
	});

	const signedParams = query['openid.signed'].split(',');
	signedParams.forEach(param => {
		const value = parsedUrl.searchParams.get(`openid.${param}`);
		assert(value, `No "${param}" parameter is present in the URL`);

		query[`openid.${param}`] = value;
	});

	// Verify that some important parameters are signed. Steam *should* check this, but let's be doubly sure.
	assert(REQUIRED_SIGNED_PARAMS.every(param => query[`openid.${param}`]), 'A vital parameter was not signed');

	return query;
}

/**
 * Get claimed_id value from query
 * @param {Object} query - the query object to extract from
 * @returns {String[]} The parsed claimed_id
 */
function extractClaimedId(query){
	const claimedIdMatch = (query['openid.claimed_id'] || '').match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)\/?$/);

	return claimedIdMatch;
}

/**
 * Sanitizes the query
 * @param {Object} query - The query object to sanitize
 * @param {String} expectedRealm - The expected realm
 * @returns {Object} The sanitized query
 * @throws {Error} If the query cannot be sanitized
 */
function sanitizeQuery(query, expectedRealm){
	// Set these params here to avoid any potential for malicious user input overwriting them
	// we will never use `query` after this point
	const sanitizedQuery = {
		...query,
		'openid.ns': 'http://specs.openid.net/auth/2.0',
		'openid.mode': 'check_authentication'
	};

	// Check openid.return_to from our query object, because it's very important that it be a signed parameter.
	assert(sanitizedQuery['openid.return_to'], 'No "openid.return_to" parameter is present in the URL');

	const realm = canonicalizeRealm(sanitizedQuery['openid.return_to']);
	assert(realm === expectedRealm, `Return realm "${realm}" does not match expected realm "${expectedRealm}"`);

	const claimedId = extractClaimedId(sanitizedQuery);
	assert(claimedId, 'No "openid.claimed_id" parameter is present in the URL, or it doesn\'t have the correct format');

	return sanitizedQuery;
}

/**
 * Extracts and verifies parameters from a URL
 * @param {String} url - The URL to extract and verify parameters from
 * @param {String} expectedRealm - The expected realm
 * @returns {Object} The extracted and verified parameters
 */
function extractAndVerifyParams(url, expectedRealm){
	const parsedUrl = new URL(url);

	const openidMode = parsedUrl.searchParams.get('openid.mode') || '';
	assert(openidMode === 'id_res', `Response parameter openid.mode value "${openidMode}" does not match expected value "id_res"`);

	const query = buildQuery(parsedUrl);
	const sanitizedQuery = sanitizeQuery(query, expectedRealm);

	return sanitizedQuery;
}

/**
 * Makes a request to Steam to verify a login response
 * @param {Object} body - The body to send to Steam
 * @returns {Promise<Boolean>} Whether the response was valid
 * @throws {Error} If the steam request is invalid
 */
async function makeSteamRequest(body){
	try{
		const response = await axios({
			method: 'POST',
			url: 'https://steamcommunity.com/openid/login',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			data: new URLSearchParams(body).toString()
		});

		return response?.data?.is_valid === true;
	} catch(err){
		const statusCode = err.response?.status;
		throw new Error(`HTTP error ${statusCode} when validating response`);
	}
}

/**
 * Verifies a login response from Steam
 * @param {String} url - The URL to verify
 * @param {String} expectedRealm - The expected realm
 * @returns {Promise<Object>} The SteamID that logged in
 */
async function verifyLogin(url, expectedRealm){
	const query = extractAndVerifyParams(url, expectedRealm);
	assert(query, 'Failed to extract and verify parameters');

	const response = await makeSteamRequest(query);
	assert(response, 'Response was not validated by Steam. It may be forged or reused.');

	return new SteamID(extractClaimedId(query)[1]);
}

module.exports = {
	verifyLogin,
	buildAuthUrl,
	canonicalizeRealm
};