module.exports = {
	// Required parameters for OpenID
	REQUIRED_PARAMS: ['claimed_id', 'return_to', 'response_nonce'],
	// Params we want to verify are signed
	REQUIRED_SIGNED_PARAMS: [
		'claimed_id', // The user's SteamID. If not signed, the SteamID could be spoofed.
		'return_to', // The return URL. If not signed, a login from another (malicious) site could be used.
		'response_nonce' // The response nonce. If not signed, a successful login could be reused.
	]
};