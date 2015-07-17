var Connector = require('./connector');
var servers = require('./config/servers');
var fs = require('fs');
var proxy = require('./lib/rpc-client/proxy');

var Application = module.exports = {};

Application.init = function(){
    this.serverMap = loadServers();
    this.serverBase = __dirname;
    this.routes = {};
    this.rpc = createProxy(this);
    var connector = Connector(this);
    connector.start();
}

var loadServers = function(){
    var serverMap = {}, slist, i, server;
    for(var serverType in servers){
        slist = servers[serverType];
        for(i = 0; i < slist.length; i++){
            server = slist[i];
            server.serverType = serverType;
            serverMap[server.id] = server;
        }
    }
    return serverMap;
};

var createProxy = function(app){
    if(typeof proxy === 'function'){
        proxy = proxy(app);
    }
    var res = proxy.create();
    return res;
};

Application.route = function(serverType, routeFun){
    if(!this.routes)
        this.routes = {};
    this.routes[serverType] = routeFun;
};


Application.getRouteType = (function(){

    var roundRobin = (function(){
        var index = 0;
        return function(routeParam, serverType, app, cb){
            var servers = app.getServersByType(serverType);
            if(index === servers.length){
                index = 0;
            }
            cb(null, servers[index].id);
            index++;
        };
    })();
    var hash = function(routeParam, serverType, app, cb){
        if(typeof routeParam === 'number')
            routeParam = routeParam.toString();
        var servers = app.getServersByType(serverType);
        var index = Math.abs(crc.crc32(routeParam)) % servers.length;
        cb(null, servers[index].id);
    }

    return  function(routeType){
        if(routeType == 'roundRobin'){
            return roundRobin;
        }
        if(routeType == 'hash'){
            return hash;
        }
    };
})();

Application.getServersByType = function(serverType){
    var allServers = this.serverMap;
    var servers = [];
    for(var serverId in allServers){
        var server = allServers[serverId];
        if(!!server.serverType && (server.serverType == serverType))
            servers.push(server);
    }
    return servers;
};