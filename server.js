var express = require('express');
var config = require('./config.js');
var app = express();

app.get('/', function (req, res) {
    res.send('saxionroosters.nl API v1');
});

app.listen(config.port, function () {
    console.log("Server listening on port " + config.port);
});