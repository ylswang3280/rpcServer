var fs = require('fs');
var servers = require('../../config/servers');
var Mailman = require('./mailman');

module.exports = function(app){
    return new Pro(app);
};

var Pro = function(app){
    this.app = app;
    this.mailman= createMailman(app);
};

Pro.prototype.create = function(){
    return genObjectProxy(this.app, this);
};

var genObjectProxy = function(app, self){
    var res = {};
    for(var serverType in servers){
        var files = fs.readdirSync(app.serverBase + '/servers/' + serverType);
        var serviceProxy = {};
        for(var i = 0; i < files.length; i++){
            var serviceName = removeSuffix(files[i], '.js');
            var service = require(app.serverBase + '/servers/' + serverType + '/' +serviceName);
            if(typeof service === 'function'){
                service = service();
            }
            var methodProxy = {};
            for(var methodName in service){
                var proxyCB2 = proxyCB.bind(null, app);
                var proxy = genFunctionProxy(self, serverType, serviceName, methodName, proxyCB2);
                methodProxy[methodName] = proxy;
            }
            serviceProxy[serviceName] = methodProxy;
        }
        res[serverType] = serviceProxy;
    }
    return res;
};


var removeSuffix = function(fileName, suffix){
    if(fileName != null && suffix != null){
        return fileName.substring(0, fileName.length - suffix.length );
    }
};

var genFunctionProxy = function(self, serverType, serviceName, methodName, cb){
    return (function(){
        var proxy = function(){
            var args = Array.prototype.slice.call(arguments, 0);
            cb.call(null, self, serverType, serviceName, methodName, args);
        }
        return proxy;
    })();
};


/**
 *
 * @param app
 * @param serverType
 * @param serviceName
 * @param methodName
 * @param args
 *
 * The cb is the callback of app.rpc object. It deals with the response data from the remote service.
 */
var proxyCB = function(app, self, serverType, serviceName, methodName, args){
    var routeParam = args.shift();
    var cb = args.pop();
    var msg = {service: serviceName, method: methodName, args: args};
    genRouteTarget(app, serverType, routeParam, msg, function(err, serverId){
        self.rpcInvoke(serverId, msg, cb);
    });
};

var genRouteTarget = function(app, serverType, routeParam,  msg, cb){
    var router = app.routes[serverType];
    router(routeParam, serverType, app, function(){
        if(!! cb && typeof cb === 'function'){
            cb.apply(null, Array.prototype.slice.call(arguments, 0));
        }
    });

};

Pro.prototype.rpcInvoke = function(serverId, msg, cb){
    this.mailman.dispatch(true, serverId, msg, cb);
};

var createMailman = function(app){
    return Mailman.create(app);
};