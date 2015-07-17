module.exports = function(){
    return new ChatRemote();
};

var ChatRemote = function(app) {

};

ChatRemote.prototype.add = function(uid, sid, channelName, cb){
    console.log(uid + 'just joined!');
    cb(uid, channelName);
};