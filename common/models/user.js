'use strict';

module.exports = function(User) {
    User.authenticate = function(cb) {
        cb(null, "Authenticating user");
    };
    User.sendCode = function(code, cb) {
        cb(null, "Sending validation code to user");
    };
    User.validate = function(code, cb) {
        cb(null, "Validating user");
    };
    User.remoteMethod(
        'authenticate', {
            description: "Authenticate an user",
            http: {
                path: '/authenticate',
                verb: 'post'
            },
            returns: {
                arg: 'confirmation',
                type: 'string'
            }
        }
    );
    User.remoteMethod(
        'sendCode', {
            description: "Send a validation code to the currently logged in user by email",
            http: {
                path: '/sendCode',
                verb: 'get'
            },
            returns: {
                arg: 'confirmation',
                type: 'string'
            }
        }
    );
    User.remoteMethod(
        'validate', {
            description: "Validate an user using a six-digit code sent by email",
            http: {
                path: '/validate',
                verb: 'post'
            },
            accepts: {
                arg: 'code',
                type: 'string',
                required: true
            },
            returns: {
                arg: 'confirmation',
                type: 'string'
            }
        }
    );
};
