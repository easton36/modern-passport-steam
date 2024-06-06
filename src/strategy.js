const { Strategy } = require('passport-strategy');
const assert = require('assert');

const {
	verifyLogin,
	buildAuthUrl,
	canonicalizeRealm
} = require('./helpers');

/**
 * `SteamStrategy` is a class that extends `Strategy` for Steam authentication.
 * @class
 * @extends Strategy
 *
 * @example
 * const strategy = new SteamStrategy({
 *   realm: 'http://yourdomain.com/',
 *   returnUrl: 'http://yourdomain.com/auth/steam/return'
 * }, (req, SteamID, done) => {
 *   // do something with the SteamID object
 * });
 */
class SteamStrategy extends Strategy{
	/**
     * Creates a new `SteamStrategy`.
     * @param {Object} options - The options for the strategy.
     * @param {string} options.realm - The realm for the strategy.
     * @param {string} options.returnUrl - The return URL for the strategy.
     * @param {Function} verify - The verify callback.
     */
	constructor(options, verify){
		super();
		this.name = 'steam';

		this._verify = verify;
		this._realm = canonicalizeRealm(options.realm);
		this._returnUrl = options.returnUrl;
	}

	/**
	 * Authenticate the user
	 * @param {Object} req - The express request object
	 * @returns {Promise<void>}
	 */
	async authenticate(req, options){
		if(req.query && req.query['openid.mode']){
			try{
				// we only care about the query params, so hostname doesnt matter
				const fullUrl = 'https://example/com' + req.url;
				const userSteamId = await verifyLogin(fullUrl, this._realm);
				assert(userSteamId, 'Steam validation failed');

				this._verify(req, userSteamId, (err, user) => {
					if(err){
						return this.error(err);
					}

					return this.success(user);
				});
			} catch(err){
				return this.fail(err);
			}
		} else{
			const authUrl = buildAuthUrl(this._realm, this._returnUrl);

			this.redirect(authUrl);
		}
	}
}

module.exports = SteamStrategy;