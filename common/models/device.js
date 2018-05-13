'use strict';

module.exports = function(Device) {
    Device.list = function(cb) {
        cb(null, "Listing devices for user");
    };
    Device.register = function(cb) {
        cb(null, "Registering device and sending validation code to user");
    };
    Device.validate = function(code, cb) {
        cb(null, "Validating device");
    };
    Device.remoteMethod(
        'list', {
            description: "List all devices for the currently logged in user",
            http: {
                path: '/list',
                verb: 'get'
            },
            returns: {
                type: 'array',
                root: true
            }
        }
    );
    Device.remoteMethod(
        'register', {
            description: "Register a new device and send a validation code by email to the currently logged in user",
            http: {
                path: '/register',
                verb: 'get'
            },
            returns: {
                arg: 'confirmation',
                type: 'string'
            }
        }
    );
    Device.remoteMethod(
        'validate', {
            description: "Validate an device using a six-digit code sent by email",
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
