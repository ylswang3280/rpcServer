var Mailbox = require('./mailbox');

var Mailman = function(app){
    this.app = app;
    this.servers = addServers(app);
    this.mailboxes = {};
    this.connecting = {};
    this.pendings = {};
    this.mailboxFactory = Mailbox;

    //filters
    this.befores = [];
    this.afters = [];
};

/**
 *
 * @param addToPendingFlag
 * @param serverId
 * @param msg
 * @param cb  callback of the proxy that deals with the response data from remote service.
 */
Mailman.prototype.dispatch = function(addToPendingFlag, serverId, msg, cb){
    var mailbox = this.mailboxes[serverId];
    var self = this;
    if(!mailbox){
        var server = this.servers[serverId];
        mailbox = this.mailboxFactory.create(server);
        this.mailboxes[serverId] = mailbox;
        this.connecting[serverId] = true;
        this.connect(serverId, msg);
        if(addToPendingFlag)
            addToPending(this, serverId, Array.prototype.slice.call(arguments, 0));
        return;
    }
    if(this.connecting[serverId]){
        addToPending(this, serverId, Array.prototype.slice.call(arguments, 0));
        return;
    }
    var send = function(err, serverId, msg){
        var mailbox = self.mailboxes[serverId];
        if(!!err){
            errorHandler();
            return;
        }
        if(!mailbox){
            console.log('Cannot find mailbox with id: ' + serverId);
            return;
        }
        mailbox.send(msg, function(){
            cb.apply(null, arguments);
        });
    };
    doFilter(null, serverId, msg, this.befores, 0, send);
};

Mailman.prototype.connect = function(serverId, msg){
    var mailbox = this.mailboxes[serverId];
    var self = this;
    mailbox.connect(function(err){
        if(!!err){
            if(!!self.mailboxes[serverId]){
                delete self.mailboxes[serverId];
            }
            return;
        }
        mailbox.on('close', function(id){
            var mbox = self.mailboxes[id];
            if(!!mbox){
                delete self.mailboxes[id];
            }

        });
        delete self.connecting[serverId];
        flushPending(self, serverId);
    });
};

var addToPending = function(self, serverId, args){
    var pending = self.pendings[serverId];
    if(!pending){
        pending = self.pendings[serverId] = [];
    }
    pending.push(args);
};

var flushPending = function(self, serverId){
    var pending = self.pendings[serverId];
    var mailbox = self.mailboxes[serverId];
    var addToPendingFlag = true;
    if(!mailbox){
        console.log('Mailbox of' + serverId + ' is empty!');
        addToPendingFlag = false;
    }
    var dispatch = self.dispatch.bind(self, addToPendingFlag);

    if(pending){
        for(var i = 0; i < pending.length; i++){
            dispatch.apply(self, pending[i]);
        }
    }
    /*  The mailbox does not exist when the flag is false, we don't want to add the pending request again.
     *  Nor do we want to delete the pending request. Just leave it there and try to connect the mailbox.
     *  When the mailbox is connected, flush the pending requests and we can safely remove them from the pendings.
     */
    if(addToPendingFlag)
        delete self.pendings[serverId];
};

var doFilter = function(err, serverId, msg, filters, index, cb){
    if(index >= filters.length || !!err){
        if(!!cb && typeof cb === 'function'){
            cb(err, serverId, msg);
        }
        return;
    }

    var filter = filters[index];
    if(typeof filter === 'function'){
        filter(serverId, msg, function(message){
            index++;
            doFilter(null, serverId, message, filters, index, cb)
        });
        return;
    }
    index++;
    doFilter(err, serverId, msg, filters, index, cb);
};

var addServers = function(app){
    var servers = {};
    var serverMap = app.serverMap;
    for(var id in serverMap){
        servers[id] = serverMap[id];
    }
    return servers;
}


module.exports.create = function(app){
    return new Mailman(app);
};