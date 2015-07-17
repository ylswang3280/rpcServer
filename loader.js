var fs = require('fs');
module.exports = function(app){
    return new Loader(app);
};

var Loader = function(app){
    this.app = app;
    this.handlers = {};
    getHandlers.call(this, this.app);
};

var loader = Loader.prototype;

var getHandlers = function(app){
    var files = fs.readdirSync(__dirname + '/handlers');
    for(var i=0; i<files.length; i++){
        var handlerName = removeSuffix(files[i], '.js');
        var handler = require(__dirname + '/handlers/' + handlerName);
        if(typeof handler === 'function'){
            handler = handler(app);
        }
        this.handlers[handlerName] = handler;
    }
};

var removeSuffix = function(fileName, suffix){
    if(fileName != null && suffix != null){
        return fileName.substring(0, fileName.length - suffix.length );
    }
};

loader.getHandler = function(handlerName){
    return this.handlers[handlerName];
};