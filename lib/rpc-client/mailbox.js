var EventEmitter = require('events').EventEmitter;
var util = require('util');
var client = require('socket.io-client');

var Mailbox = function(server){
    EventEmitter.call(this);
    this.pkgId = 0;
    this.resquestCBs = {};
    this.server = server;
    this.id = server.id;
    this.host = server.host;
    this.port = server.port;
    this.connected = false;

};

util.inherits(Mailbox, EventEmitter);

var pro = Mailbox.prototype;

pro.connect = function(cb){
    if(this.connected){
        cb('Mailbox has already connected');
    }
    var self = this;
    this.socket = client.connect(this.host + ':' + this.port, {'force new connection': true, 'reconnect': false});
    this.socket.on('message', function(pkg){
        processMsgs(pkg);
    });

    this.socket.on('connect', function(){
        if(self.connected){
            return;
        };
        self.connected = true;
        cb();
    });

    this.socket.on('err', function(err){
        self.emit('close', self.id);
        cb(err);
    });

    this.socket.on('disconnect', function(reason){
        console.log('rpc socket is disconnected, reason: ' + reason);
        self.emit('close', self.id);
    });
};

pro.send = function(msg, cb){
    var id = this.pkgId;
    this.requestCBs[id] = cb;
    var pkg = {id: id, msg: msg};
    this.pkgId += 1;
    this.socket.emit('message', msg);
};

module.exports.create = function(server){
    return new Mailbox(server);
};