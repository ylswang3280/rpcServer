
module.exports = function(app){
    return new EntryHandler(app);
};

var EntryHandler = function(app){
    this.app = app;
};

var handler = EntryHandler.prototype;

handler.entry = function(msg, session, next){
    var uid = msg.uid;
    console.log('user ' + uid + ' just logged in!');
    session.bind(uid);
    this.app.rpc.time.timeRemote.getCurrentTime(1, 'hello', 'roy', function(hour, min, sec){
        console.log("Remote time: " + hour + ':' + min + ':' + sec);
    });
    next(null, {
        msg: 'you just logged in.'
    });
}