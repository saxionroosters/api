'use strict';
var speakeasy = require('speakeasy');
var path = require('path');
const nodemailer = require('nodemailer');

module.exports = function(Account) {
    require('dotenv').config({path: path.resolve(__dirname, '../../.env')});

    Account.disableRemoteMethodByName('prototype.__findById__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__destroyById__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__updateById__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__get__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__create__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__delete__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__count__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__exists__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__link__accessTokens', true);
    Account.disableRemoteMethodByName('prototype.__unlink__accessTokens', true);
    
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
                var verificationCode = speakeasy.totp({secret: 'APP_SECRET' + credentials.email});
                console.log('Two factor code for ' + credentials.email + ': ' + verificationCode);
                    
                updateRequestCode(credentials, verificationCode, function(error, result) {
                    //var myMessage = {code: verificationCode, device: "Desktop"}; 
 
                    // prepare a loopback template renderer
                    //var renderer = loopback.template(path.resolve(__dirname, '../../common/views/verification-mail.ejs'));
                    //var html_body = renderer(myMessage);

                    if (error == null) {
                        sendEmail(credentials, verificationCode, function(err, res) {
                            if (err != null) {
                                var err = new Error();
                                err.error = 'An error occurred whilst sending the verification email';
                                err.errorCode = 'MAIL_SERVER_ERROR';
                                err.statusCode = 500;
                                fn(null, err);
                            } else {
                                fn(null, { response: 'success' })
                            }
                        });
                    } else {
                        var err = new Error();
                        err.error = 'An error occurred whilst updating data in the database';
                        err.errorCode = 'DATABASE_ERROR';
                        err.statusCode = 500;
                        fn(null, err);
                    }
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
        Account.upsertWithWhere({ email: credentials.email }, { registerToken: code }, function(err, res) {
            if (err){
                cb(err, null);
            } else {
                cb(null, res.registerToken);  
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

    function sendEmail(credentials, code, cb) {
        console.log('Sending email...');
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_SERVER,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        });

        // TODO: Translations
        // TODO: Make a better email template
        let mailOptions = {
            from: 'Saxion Roosters <no-reply@saxionroosters.nl>',
            to: credentials.email,
            subject: 'Your verification code for Saxion Roosters',
            text: 'Your verification code is ' + code,
            html: '<p>Your verification code is <b>' + code + '</b></p>'
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error){
                console.log('Error: ' + error);
                cb(error, false);
            } else {
                console.log('Message sent: %s', info.messageId);
                cb(null, true);
            }
        });
    };

    Account.verify = function(credentials, fn) {
        var err = new Error('Sorry, but that verification code does not work!');
        err.statusCode = 401;
        err.code = 'VERIFICATION_FAILED';
      
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
            description: "Request a verification code to log in a user",
            notes: ["Sends an email to the user with a generated verification code.\n", "Returns 'true' when the verification mail is successfully send;", "otherwise returns an error (with description)."],
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
                arg: 'success',
                type: 'string'
            }
        }
    );
    Account.remoteMethod(
        'verify', {
            description: "Verify a user with a verification code",
            http: {
                path: '/verify',
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
