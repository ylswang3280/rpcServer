var Connector = require('./connector');
var application = require('./application');
/*
var connector = Connector();
connector.start();
*/

application.init();

var roundRobin = application.getRouteType('roundRobin');

application.route('time', roundRobin);