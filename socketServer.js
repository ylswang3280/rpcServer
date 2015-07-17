/**
 * Created by root on 15-7-9.
 */
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var SocketServer = function(){
    EventEmitter.call(this);

    server.listen(3000);
    console.log("Server is listening at port 3000");
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/views/index.html');
    });
    var self = this;
    io.on('connection', function(socket){
        self.emit('connection', socket);
    });
};

util.inherits(SocketServer, EventEmitter);

module.exports = SocketServer;

var pro = SocketServer.prototype;

pro.send = function(socket, data){
    socket.emit('message', data);
};