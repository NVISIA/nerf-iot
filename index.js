var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var methodOverride = require('method-override');
var path = require('path');
var errorHandler = require('errorhandler');
var _ = require('lodash');
var cylon = require('cylon');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

var participants = [];
var spinning = null;
var firing = null;
var nameCounter = 1;
var self = this;

app.set('port', process.env.PORT || 3000);

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env') || 'local' == app.get('env')) {
    app.use(errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
}

function connections(robot) {
    if ('local' == app.get('env')) {
        return {
            edison: {adaptor: "loopback"}
        };
    } else {
        return {
            edison: {adaptor: 'intel-iot'}
        };
    }
}

function devices(robot) {
    if ('local' == app.get('env')) {
        return {
            spinPin: {driver: 'ping', connection: 'edison'},
            firePin: {driver: 'ping', connection: 'edison'}
        };
    } else {
        return {
            spinPin: {driver: 'direct-pin', pin: 4},
            firePin: {driver: 'direct-pin', pin: 8}
        };
    }
}

cylon.robot({
    connections: connections(),
    devices: devices(),

    work: function(my) {
        if ('local' == app.get('env')) {
            my.spinPin.digitalWrite = function() {};
            my.firePin.digitalWrite = function() {};
        }
        my.spinPin.digitalWrite(0);
        my.firePin.digitalWrite(0);

        io.on("connection", function(socket) {
            console.log("ON connection", socket.id);

            var newName = "Guest " + nameCounter++;
            var participant = {
                id: socket.id,
                name: newName
            };
            participants.push(participant);

            io.emit("new_connection", {
                participant: participant,
                sender: "system",
                created_at: new Date().toISOString(),
                participants: participants,
                spinning: self.spinning,
                firing: self.firing
            });

            socket.on("name_change", function(data) {
                console.log("ON name_change", data);

                var p = _.find(participants, {
                    id: socket.id
                });
                p.name = data.name;
                io.emit("name_changed", p);
            });

            socket.on("spin_up", function() {
                console.log("ON spin_up", socket.id);

                var p = _.find(participants, {
                    id: socket.id
                });
                self.spinning = socket.id;
                spin(true, my);
                io.emit("spun_up", p);
            });

            socket.on("spin_down", function() {
                console.log("ON spin_down", socket.id);

                var p = _.find(participants, {
                    id: socket.id
                });
                spin(false, my);
                self.spinning = null;
                io.emit("spun_down", p);
            });

            socket.on("fire_on", function() {
                console.log("ON fire_on", socket.id);

                var p = _.find(participants, {
                    id: socket.id
                });
                fire(true, my);
                self.firing = socket.id;
                io.emit("fired_on", p);
            });

            socket.on("fire_off", function() {
                console.log("ON fire_off", socket.id);

                var p = _.find(participants, {
                    id: socket.id
                });
                fire(false, my);
                self.firing = null;
                io.emit("fired_off", p);
            });

            socket.on("disconnect", function() {
                console.log("ON disconnect", socket.id);

                var participant = _.find(participants, {
                    id: socket.id
                });
                if (self.firing == socket.id) {
                    self.firing = null;
                    fire(false, my);
                }
                if (self.spinning == socket.id) {
                    self.spinning = null;
                    spin(false, my);
                }

                participants = _.without(participants, participant);
                io.sockets.emit("user_disconnected", {
                    participant: participant,
                    sender: "system",
                    created_at: new Date().toISOString(),
                    participants: participants
                });
                socket.disconnect(true);
            });
        });

    }
}).start();

function spin(state, board) {
    if (state) {
        console.log("Nerf gun spinning up");
        board.spinPin.digitalWrite(1);
    } else {
        console.log("Nerf gun spinning down");
        board.spinPin.digitalWrite(0);
    }
}

function fire(state, board) {
    if (state) {
        console.log("Nerf gun firing");
        board.firePin.digitalWrite(1);
    } else {
        console.log("Nerf gun ceasing fire");
        board.firePin.digitalWrite(0);
    }
}

http.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
