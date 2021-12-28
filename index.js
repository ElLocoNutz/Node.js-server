var server = require('./lib/server');
var workers = require('./lib/workers');


var app = {};


app.init = function(config) {
    //start the server and the worksers
    server.init();
    workers.init();
    
};


app.init();


module.exports = app;