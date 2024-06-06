const express = require('express');
const passport = require('passport');
const SteamStrategy = require('../../src');

const app = express();

const HOST = 'http://localhost';
const PORT = 3000;
const LOGIN_ROUTE = '/login';

passport.use(new SteamStrategy({
	realm: `${HOST}:${PORT}`,
	returnUrl: `${HOST}:${PORT}${LOGIN_ROUTE}/return`
}, (SteamID, done) => {
	// Here you would look up the user in your database using the SteamID
	// For this example, we're just passing the SteamID64 back as the user id
	const user = {
		id: SteamID.getSteamID64()
	};

	done(null, user);
}));

function authenticateMiddleware(req, res, next) {
	passport.authenticate('steam', { session: false }, (err, user, info) => {
		if(err) {
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
	// Successful authentication, redirect home.
	console.log(`User signed in with SteamID64: ${req.user.id}`);

	return res.send(`Logged in! Your SteamID64 is: ${req.user.id}`);
});

app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`);
	console.log(`Test logins at: ${HOST}:${PORT}${LOGIN_ROUTE}`);
});