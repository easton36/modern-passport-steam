const express = require('express');
const passport = require('passport');
const SteamStrategy = require('../../src');

const app = express();

const HOST = 'http://computer.local'; // valve has some weird rule that blocks the request when "realm" is localhost or 127.0.0.1
const PORT = 3000;
const LOGIN_ROUTE = '/login';

passport.use(new SteamStrategy({
	realm: `${HOST}:${PORT}`,
	returnUrl: `${HOST}:${PORT}${LOGIN_ROUTE}/return`,
	fetchSteamLevel: true,
	fetchUserProfile: true,
	apiKey: () => {
		// You should return your Steam API key here
		// For security, you should use environment variables or a secure key management service
		// Can be a string or a function that returns a string
		// Can be async if you need to fetch the key from a remote service!

		return 'YOUR_STEAM_API_KEY_HERE';
	}
}, (user, done) => {
	// Here you would look up the user in your database using the SteamID
	// For this example, we're just passing the full user object back

	done(null, user);
}));

/**
 * Middleware to authenticate a user with Steam
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next function
 */
function authenticateMiddleware(req, res, next) {
	passport.authenticate('steam', { session: false }, (err, user, info) => {
		if(err) {
			console.error('Error authenticating user:', err);

			// Handle errors like exceptions thrown in strategy
			return res.status(500).json({ error: err?.message || err });
		}
		if(!user) {
			// Handle authentication failure
			return res.status(401).json({ error: info.message || 'Authentication failed' });
		}
		// If there's a user, attach to request and continue
		req.user = user;
		next();
	})(req, res, next);
}

app.use(passport.initialize());

app.get(LOGIN_ROUTE, passport.authenticate('steam', { session: false }));

app.get(`${LOGIN_ROUTE}/return`, authenticateMiddleware, function(req, res) {
	const personaname = req.user?.profile?.personaname;
	const steamid = req.user?.profile?.steamid;
	const avatarfull = req.user?.profile?.avatarfull;
	const level = req.user?.level;
	// Successful authentication, redirect home.
	console.log(`User signed in with SteamID64: ${steamid}`);

	return res.send(`Welcome, ${personaname}! Your Steam ID is: ${steamid}. Your Steam level is: ${level}. <br /> <img src="${avatarfull}" alt="Your avatar">`);
});

app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`);
	console.log(`Test logins at: ${HOST}:${PORT}${LOGIN_ROUTE}`);
});