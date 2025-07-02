const { Strategy } = require('passport-strategy');
const assert = require('assert');

const {
	verifyLogin,
	buildAuthUrl,
	canonicalizeRealm
} = require('./helpers');
const {
	fetchSteamProfile,
	fetchSteamLevel
} = require('./steam-api');

/**
 * `SteamStrategy` is a class that extends `Strategy` for Steam authentication.
 * @class
 * @augments Strategy
 * @example
 * const strategy = new SteamStrategy({
 *   realm: 'http://yourdomain.com/',
 *   returnUrl: 'http://yourdomain.com/auth/steam/return',
 *   fetchSteamLevel: true,
 *   fetchUserProfile: true,
 *   apiKey: () => {
 *     // You should return your Steam API key here
 *     // For security, you should use environment variables or a secure key management service
 *     // Can be a string or a function that returns a string
 *     // Can be async if you need to fetch the key from a remote service!
 *   }
 * }, (user, done) => {
 *   // do something with the user object
 * });
 */
class SteamStrategy extends Strategy {
	/**
	 * Creates a new `SteamStrategy`.
	 * @param {object} options - The options for the strategy.
	 * @param {string} options.realm - The realm for the strategy.
	 * @param {string} options.returnUrl - The return URL for the strategy.
	 * @param {string | Function} options.apiKey - The Steam API key to use for fetching user data.
	 * @param {boolean} [options.fetchUserProfile=true] - Whether to fetch the user's profile. Default is `true`.
	 * @param {boolean} [options.fetchSteamLevel=false] - Whether to fetch the user's steam level. Default is `false`.
	 * @param {Function} verify - The verification function for the strategy.
	 */
	constructor(options, verify) {
		super();
		this.name = 'steam';

		this._verify = verify;
		this._realm = canonicalizeRealm(options.realm);
		this._returnUrl = options.returnUrl;
		this._apiKey = options.apiKey;
		this._fetchUserProfile = options.fetchUserProfile ?? true;
		this._fetchSteamLevel = options.fetchSteamLevel ?? false;

		if(!this._realm) {
			throw new Error('OpenID realm is required');
		}
		if(!this._returnUrl) {
			throw new Error('OpenID return URL is required');
		}
		// If _fetchUserProfile is false then we dont need to check for API key
		if((this._fetchUserProfile || this._fetchSteamLevel) && !this._apiKey) {
			throw new Error('Steam API key is required to fetch user data. Set fetchUserProfile to false if you do not want to include a Steam API key');
		}
	}

	/**
	 * Get the correct format of the user data based on options
	 * @param {object} SteamID - The SteamID object
	 * @returns {Promise<object>} The user data
	 */
	async fetchUserData(SteamID) {
		const steamId64 = SteamID.getSteamID64();
		if(!this._apiKey) return SteamID;

		const apiKey = typeof this._apiKey === 'string'
			? this._apiKey
			: await this._apiKey(SteamID);

		const user = {
			SteamID
		};

		if(this._fetchUserProfile) {
			user.profile = await fetchSteamProfile(steamId64, apiKey);
		}
		if(this._fetchSteamLevel) {
			user.level = await fetchSteamLevel(steamId64, apiKey);
		}

		return user;
	}

	/**
	 * Authenticate the user
	 * @param {object} req - The express request object
	 * @returns {Promise<void>}
	 */
	async authenticate(req) {
		if(!req.query || !req.query['openid.mode']) {
			const authUrl = buildAuthUrl(this._realm, this._returnUrl);

			return this.redirect(authUrl);
		}

		try{
			// we only care about the query params, so hostname doesnt matter
			const fullUrl = 'https://example.com' + req.url;
			const userSteamId = await verifyLogin(fullUrl, this._realm);
			assert(userSteamId, 'Steam validation failed');

			// Fetch the user's profile and steam level
			const user = await this.fetchUserData(userSteamId);

			this._verify(user, (err, user) => {
				if(err) {
					return this.error(err);
				}

				return this.success(user);
			});
		} catch(err) {
			return this.fail(err);
		}
	}
}

module.exports = SteamStrategy;