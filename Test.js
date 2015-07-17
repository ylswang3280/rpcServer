var SocketServer = require('./socketServer');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports.create = function(){
    return new Test();
};


var Test = function(){
    this.obj = 'haha';
}