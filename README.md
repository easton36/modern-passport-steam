# Modern Steam OpenID strategy for Passport

A modern [Passport](https://github.com/jaredhanson/passport) strategy for authenticating
with [Steam](http://steamcommunity.com/) using OpenID 2.0. Inspired by the original [passport-steam](https://raw.githubusercontent.com/liamcurry/passport-steam) strategy, and DoctorMcKay's [node-steam-signin](https://github.com/DoctorMcKay/node-steam-signin) library.

## Installation

```bash
$ npm install --save modern-passport-steam
```

## Usage

#### Require Strategy

```js
const SteamStrategy = require('modern-passport-steam');
```

#### Configure Strategy

```js
passport.use(new SteamStrategy({
	returnURL: 'http://localhost:3000/login/return',
	realm: 'http://localhost:3000/',
}, (SteamID, done) => {
	// Here you would look up the user in your database using the SteamID
	// For this example, we're just passing the SteamID64 back as the user id
	const user = {
		id: SteamID.getSteamID64()
	};

	done(null, user);
}));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'steam'` strategy, to authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/) application:

```js
app.get('/login', passport.authenticate('steam'));

app.get('/login/return', passport.authenticate('steam', {
	failureRedirect: '/login'
}), (req, res) => {
	// Successful authentication, redirect home.
	res.redirect('/');
});
```

## Examples

There is a basic example using express in the [examples folder](https://github.com/easton36/modern-steam-passport/tree/master/examples/express).

## License

[The MIT License](https://github.com/easton36/modern-steam-passport/blob/master/LICENSE)
