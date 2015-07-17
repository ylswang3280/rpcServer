/**
 * Created by root on 15-7-8.
 */


module.exports = function(){
    return new SessionService();
};

var SessionService = function(){
    this.sessions = {};
};

SessionService.prototype.createSession = function(socket){
    var session = new Session(socket);
    this.sessions[session.id] = session;
    return session;
};

SessionService.prototype.getSession = function(socketId){
    return this.sessions[socketId];
}

var Session = function(socket){
    this.id = socket.id;
    this.interval = null;
    this.socket = socket;
    this.uid = null;
};

Session.prototype.bind = function(uid){
    this.uid = uid;
};