'use strict';
var speakeasy = require('speakeasy');

module.exports = function(Account) {

    /** Intercept account creation and substitute password with a placeholder password
	 */
	// Account.observe('before save', function(ctx, next) {
	// 	// Substitute password
	// 	ctx.instance.password = "psswrd";
	// 	// Remember to use next() to not interrupt the flow of the call
	// 	return next();
    // });
    
    Account.register = function(credentials, fn) {
        findAccount(credentials, function(res) {
            if (res != 0) {
                var err = new Error();
                err.error = 'Account already registered!';
                err.errorCode = 'ACCOUNT_ALREADY_REGISTERED';
                err.statusCode = 401;
                fn(null, err);
            } else {
                createAccount(credentials, function(result) {
                    fn(null, result);
                });
            }
        });
    };

    Account.requestCode = function(credentials, fn) {
        findAccount(credentials, function(res) {
            if (res <= 0 || res > 1) {
                var err = new Error();
                err.error = 'No account found with given email!';
                err.errorCode = 'ACCOUNT_NOT_FOUND';
                err.statusCode = 404;
                fn(null, err);
            } else {
                var code = speakeasy.totp({secret: 'APP_SECRET' + credentials.email});
                console.log('Two factor code for ' + credentials.email + ': ' + code);
                    
                updateRequestCode(credentials, code, function(result) {
                    fn(null, { code: result });
                });
            }
        });
    };

    function findAccount(credentials, cb) {
        Account.count({ email: credentials.email }, function(err, res) {
            console.log('res: ' + res);
            cb(res);
        });
    };

    function createAccount(credentials, cb) {
        Account.create({username: credentials.email, email: credentials.email, password: 'password', registerDate: ''}, function(err, accountInstance) {
            console.log('account: ' + JSON.stringify(accountInstance));
            cb(accountInstance);
        });
    };

    function updateRequestCode(credentials, code, cb) {
        Account.upsertWithWhere({ email: credentials.email }, { registerToken: code }, function(err, account) {
            if (err){
                cb(err);
            } else {
                cb(account.registerToken);  
            }
        });
    };

    function removeRequestCode(credentials, cb) {
        Account.upsertWithWhere({ email: credentials.email }, { registerToken: "" }, function(err, success) {
            if (err){
                cb(err, false);
            } else {
                cb(null, true);  
            }
        });
    };

    Account.loginWithCode = function(credentials, fn) {
        var err = new Error('Sorry, but that verification code does not work!');
        err.statusCode = 401;
        err.code = 'LOGIN_FAILED';
      
        this.findOne({ where: { email: credentials.email } }, function(err, user) {
          var code = user.registerToken;
          console.log('Code from database: ' + code);
          console.log('Given code: ' + credentials.code);
          console.log('user: ' + JSON.stringify(user));
      
          if (user) {
            if (code !== credentials.code) {
                return fn("Sorry, but that verification code does not work!");
            } else {
                user.createAccessToken(-1, function (error, token) {
                    removeRequestCode(credentials, function(removeErr, success) {
                        if (success) {
                            return fn(error, token);
                        } else {
                            return fn(new Error("An error occured whilst trying to remove old request code"), null);
                        }
                    });
                });
            }
          } else {
              return fn(new Error("No user found"), null);
          }
        });
    };
    Account.remoteMethod(
        'register', {
            description: "Register a new account",
            http: {
                path: '/register',
                verb: 'post',
                errorStatus: '400'
            },
            accepts: {
                arg: 'credentials',
                description: 'Credentials',
                type: 'object',
                required: true,
                http: {
                    source: 'body'
                } 
            },
            returns: {
                arg: 'code',
                type: 'array',
                root: true
            }
        }
    );
    Account.remoteMethod(
        'requestCode', {
            description: "Request a code to log in an user",
            http: {
                path: '/requestCode',
                verb: 'post',
                errorStatus: '400'
            },
            accepts: {
                arg: 'credentials',
                description: 'Credentials',
                type: 'object',
                required: true,
                http: {
                    source: 'body'
                } 
            },
            returns: {
                arg: 'code',
                type: 'array',
                root: true
            }
        }
    );
    Account.remoteMethod(
        'loginWithCode', {
            description: "Log an user in with a code",
            http: {
                path: '/loginWithCode',
                verb: 'post'
            },
            accepts: {
                arg: 'credentials',
                description: 'Credentials',
                type: 'object',
                http: {
                    source: 'body'
                } 
            },
            returns: {
                arg: 'confirmation',
                type: 'string'
            }
        }
    );
};
