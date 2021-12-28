var http = require('http');
var https = require('https');
var url = require('url');   
var sd = require('string_decoder').StringDecoder;
var fs = require('fs');
var path = require('path');
var config = require('./config');
// var _data = require('./data');
var handlers = require('./handlers');
var helpers = require('./helpers');


var server = {};

// start HTTP server
server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req,res);
});

// start HTTPS server
server.httpsServerOptions = {
    'key'   : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert'  : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res){
    unifiedServer(req,res);
});

server.unifiedServer = function(req,res){
    // get Url
    var parsedUrl = url.parse(req.url, true);

    // get path
    var path = parsedUrl.pathname;
    var trimPath = path.replace(/^\/+|\/+$/g, '');

    // get query string como objeto
    var qs = parsedUrl.query;
    // console.log(parsedUrl);

    // get Method
    var method = req.method.toLocaleLowerCase();

    // get headers como objeto
    var headers = req.headers;

    // get payload
    var decoder = new sd('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        // escoger handler
        var elHandler = typeof(server.router[trimPath]) !== 'undefined' ? server.router[trimPath] : handlers.notFound;


        elHandler = trimPath.indexOf('public/') > -1 ? handlers.public : elHandler;
        //construir dataobject
        var data = {
            'trimPath'  : trimPath,
            'qs'        : qs,
            'method'    : method,
            'headers'   : headers,
            'payload'   : helpers.parseJsonToObject(buffer)
        };
        
        // route the request
        elHandler(data, function(statusCode, payload, contentType){

            contentType = typeof(contentType) === 'string' ? contentType : 'json';

            console.log("payload: ",data.payload,statusCode);

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            
            // return response content specific
            var payloadString = '';
            if(contentType == 'json'){
                res.setHeader('Content-Type','application/json');
                payload = typeof(payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);

            }
            if(contentType == 'html'){
                res.setHeader('Content-Type','text/html');
                payloadString = typeof(payload) == 'string' ? payload : '';
            }
            if(contentType == 'favicon'){
                res.setHeader('Content-Type','image/x-icon');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if(contentType == 'css'){
                res.setHeader('Content-Type','text/css');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if(contentType == 'png'){
                res.setHeader('Content-Type','image/png');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if(contentType == 'jpg'){
                res.setHeader('Content-Type','image/jpeg');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if(contentType == 'plain'){
                res.setHeader('Content-Type','text/plain');
                payloadString = typeof(payload) == 'string' ? payload : '';
            }
            if(contentType == 'javascript'){
                res.setHeader('Content-Type','text/javascript');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            res.writeHead(statusCode);
            res.end(payloadString);


            //console.log("Respuesta",statusCode, payloadString);
        });
    });
};

server.router = {
    ''              : handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit'  : handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all'    : handlers.checksList,
    'checks/create' : handlers.checksCreate,
    'checks/edit'   : handlers.checksEdit,
    'ping'          : handlers.ping,
    'api/users'     : handlers.users,
    'api/tokens'    : handlers.tokens,
    'api/checks'    : handlers.checks,
    'favicon.ico'   : handlers.favicon,
    'public'        : handlers.public
};  

server.init = function(){
    server.httpServer.listen(config.httpPort,function(){
        console.log("Server listening on port "+config.httpPort+" en modo "+config.envName)
    });
    server.httpsServer.listen(config.httpsPort,function(){
        console.log("Server listening on port "+config.httpsPort+" en modo "+config.envName)
    });
};

module.exports = server;