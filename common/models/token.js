'use strict';
//var uuid = require('uuidv4');

module.exports = function(Token) {
	
    /** Define a custom token id creation process
	 *
	Token.createCustomAccessTokenId = function (callback) {
		
		return callback(null, uuid());
	}; */

	/** Intercept token creation and substitute id with our custom id
	 */
	Token.observe('before save', function(ctx, next) {
		// Invoke custom id function
		//return Token.createCustomAccessTokenId(function(err, id) {
			//if (err)
			//	return next(err);
			// Substitute id
			ctx.instance.device = "Device"; // TODO: set an user-read-friendly name (e.g. Wessel's iPhone)
			// Remember to use next() to not interrupt the flow of the call
			return next();
		//});
	});
};
