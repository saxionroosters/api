'use strict';

module.exports = function(User) {
    User.authenticate = function(cb) {
        cb(null, "Authenticating user");
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
};
