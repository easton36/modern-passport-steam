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

If you want to fetch the user's Steam level and profile, you will need to provide a Steam API key. You can get one [here](https://steamcommunity.com/dev/apikey).
If you do not pass an api key, the first parameter passed to the verify callback will be the SteamID object, as you can see in the examples below.

With Profile Fetching:
```js
passport.use(new SteamStrategy({
	returnUrl: 'http://localhost:3000/login/return',
	realm: 'http://localhost:3000/',
	fetchSteamLevel: true,
	fetchUserProfile: true,
	apiKey: () => {
		// You should return your Steam API key here
		// For security, you should use environment variables or a secure key management service
		// Can be a string or a function that returns a string
		// Can be async if you need to fetch the key from a remote service!
		return 'MY_STEAM_API_KEY';
	}
}, (user, done) => {
	// Here you would look up the user in your database using the SteamID
	// For this example, we're just passing the full user object back

	done(null, user);
}));
```

Example user object if you pass an API key:
```js
{
  SteamID: SteamID { universe: 1, type: 1, instance: 1, accountid: 893472231 },
  profile: {
    steamid: '76561198853737959',
    communityvisibilitystate: 3,
    profilestate: 1,
    personaname: 'sampli',
    commentpermission: 1,
    profileurl: 'https://steamcommunity.com/id/shamp/',
    avatar: 'https://avatars.steamstatic.com/979e4a6baa364403e1dc268a52034162044ae391.jpg',
    avatarmedium: 'https://avatars.steamstatic.com/979e4a6baa364403e1dc268a52034162044ae391_medium.jpg',
    avatarfull: 'https://avatars.steamstatic.com/979e4a6baa364403e1dc268a52034162044ae391_full.jpg',
    avatarhash: '979e4a6baa364403e1dc268a52034162044ae391',
    lastlogoff: 1716699862,
    personastate: 0,
    primaryclanid: '103582791429521408',
    timecreated: 1534350460,
    personastateflags: 0
  },
  level: 52
}
```

Without Profile Fetching:
```js
passport.use(new SteamStrategy({
	returnUrl: 'http://localhost:3000/login/return',
	realm: 'http://localhost:3000/',
	fetchSteamLevel: true,
	fetchUserProfile: true,
	apiKey: false
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
