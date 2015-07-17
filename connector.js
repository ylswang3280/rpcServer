var SocketServer = require('./socketServer');
var sessionService = require('./sessionService');
var loader = require('./loader');

module.exports = function(app){
    return new Connector(app);
}
var Connector = function(app){
    this.app = app;
    this.sessionService = null;
    this.loader = null;
    this.socketServer = null;

};

var pro = Connector.prototype;

pro.start = function(){
    if(typeof sessionService === 'function'){
        this.sessionService = sessionService();
    }
    if(typeof loader == 'function'){
        this.loader = loader(this.app);
    }
    var self = this;
    this.socketServer = new SocketServer();
    this.socketServer.on('connection', function(socket){

        socket.on('message', function (data) {
            var session = self.sessionService.getSession(socket.id);
            if(!session){
                session = self.sessionService.createSession(socket);
            }
            handleMessage(self, session, data);
        });

    });


};

var handleMessage = function(self, session, data){
    var routeRecord = parseRoute(data.route);
    var handler = self.loader.getHandler(routeRecord.handler);
    handler[routeRecord.method](data.msg, session, function(err, resp){
        if(!resp){
            resp = {};
        }
        if(!!err){
            resp.code = 500;
        }
        self.socketServer.send(session.socket, resp);
    });
}


var parseRoute = function(route){
    if(!route)
        return null;

    var ts = route.split('.');
    return {
        handler: ts[0],
        method: ts[1]
    };

};
