'use strict';

module.exports = function(Device) {
    Device.list = function(cb) {
        cb(null, "Listing devices for user");
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
};