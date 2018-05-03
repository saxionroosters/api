'use strict';

module.exports = function(Schedule) {
    Schedule.list = function(cb) {
        cb(null, "Listing schedules for logged in user");
    };
    Schedule.remoteMethod(
        'list', {
            description: "List all saved schedules for the currently logged in user",
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
