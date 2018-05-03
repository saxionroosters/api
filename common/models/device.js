'use strict';

module.exports = function(Device) {
    Device.register = function(username, cb) {
        cb(null, "Registering device for user " + username);
    };
    Device.remoteMethod(
        'register', {
            description: "Register a new device to an user",
            http: {
                path: '/register',
                verb: 'post'
            },
            accepts: {
                arg: 'username',
                type: 'string'
            },
            returns: {
                arg: 'confirmation',
                type: 'string'
            }
        }
    );
};
