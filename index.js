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
                var participant = findParticipant(socket.id);
                participant.name = data.name;
                io.emit("name_changed", participant);
            });

            socket.on("spin_up", function() {
                console.log("ON spin_up", socket.id);
                spin(true, my, socket);
            });

            socket.on("spin_down", function() {
                console.log("ON spin_down", socket.id);
                if (self.firing) {
                    fire(false, my, socket);
                }
                spin(false, my, socket);
            });

            socket.on("fire_on", function() {
                console.log("ON fire_on", socket.id);
                fire(true, my, socket);
            });

            socket.on("fire_off", function() {
                console.log("ON fire_off", socket.id);
                fire(false, my, socket);
            });

            socket.on("disconnect", function() {
                console.log("ON disconnect", socket.id);

                var participant = findParticipant(socket.id);
                if (self.firing == socket.id) {
                    fire(false, my, socket);
                }
                if (self.spinning == socket.id) {
                    spin(false, my, socket);
                }

                participants = _.without(participants, participant);
                io.sockets.emit("user_disconnected", {
                    participant: participant,
                    sender: "system",
                    created_at: new Date().toISOString(),
                    participants: participants,
                    spinning: self.spinning,
                    firing: self.firing
                });
                socket.disconnect(true);
            });
        });

    }
}).start();

function spin(state, board, socket) {
    var participant = findParticipant(socket.id);
    if (state) {
        console.log("Nerf gun spinning up");
        board.spinPin.digitalWrite(1);
        self.spinning = socket.id;
        io.emit("spun_up", participant);
    } else {
        console.log("Nerf gun spinning down");
        board.spinPin.digitalWrite(0);
        self.spinning = null;
        io.emit("spun_down", participant);
    }
}

function fire(state, board, socket) {
    var participant = findParticipant(socket.id);
    if (state) {
        console.log("Nerf gun firing");
        board.firePin.digitalWrite(1);
        self.firing = socket.id;
        io.emit("fired_on", participant);
    } else {
        console.log("Nerf gun ceasing fire");
        board.firePin.digitalWrite(0);
        self.firing = null;
        io.emit("fired_off", participant);
    }
}

function findParticipant(id) {
    return _.find(participants, {
        id: id
    });
}

http.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
