var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sessionService = require('./sessionService');
var loader = require('./loader');

server.listen(3000);
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/views/index.html');
});

if(typeof sessionService === 'function'){
    sessionService = sessionService();
}
if(typeof loader == 'function'){
    loader = loader();
}

io.on('connection', function (socket) {
    socket.on('message', function (data) {
        var session = sessionService.getSession(socket.id);
        if(!session){
            session = sessionService.createSession(socket);
        }
        var routeRecord = parseRoute(data.route);
        var handler = loader.getHandler(routeRecord.handler);
        handler[routeRecord.method](data.msg, session, null);
    });
});


var parseRoute = function(route){
    if(!route)
        return null;

    var ts = route.split('.');
    return {
        handler: ts[0],
        method: ts[1]
    };

};