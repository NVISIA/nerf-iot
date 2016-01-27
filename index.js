var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var methodOverride = require('method-override');
var path = require('path');
var errorHandler = require('errorhandler');
var _ = require('lodash');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

app.set('port', process.env.PORT || 3000);

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
}
var participants = [];
var nameCounter = 1;

function spin(participants) {
    var p = _.filter(participants, {
        spinning: true
    });

    if (_.isEmpty(p)) {
        console.log("Nerf gun spinning down");
        // TODO talk to the Edison
    } else {
        console.log("Nerf gun spinning up");
        // TODO talk to the Edison
    }
    return p;
}

function fire(participants) {
    var p = _.filter(participants, {
        firing: true
    });
    if (_.isEmpty(p)) {
        console.log("Nerf gun ceasing fire");
        // TODO talk to the Edison
    } else {
        console.log("Nerf gun firing");
        // TODO talk to the Edison
    }
    return p;
}

io.on("connection", function(socket) {
    console.log("ON connection", socket.id);

    var newName = "Guest " + nameCounter++;
    var participant = {
        id: socket.id,
        name: newName,
        spinning: false,
        firing: false
    };
    participants.push(participant);

    io.sockets.emit("new_connection", {
        participant: participant,
        sender: "system",
        created_at: new Date().toISOString(),
        participants: participants
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
        p.spinning = true;
        io.sockets.emit("spinning", spin(participants));
    });

    socket.on("spin_down", function() {
        console.log("ON spin_down", socket.id);

        var p = _.find(participants, {
            id: socket.id
        });
        p.spinning = false;
        io.sockets.emit("spinning", spin(participants));
    });

    socket.on("fire_on", function() {
        console.log("ON fire_on", socket.id);

        var p = _.find(participants, {
            id: socket.id
        });
        p.firing = true;
        io.sockets.emit("firing", fire(participants));
    });

    socket.on("fire_off", function() {
        console.log("ON fire_off", socket.id);

        var p = _.find(participants, {
            id: socket.id
        });
        p.firing = false;
        io.sockets.emit("firing", fire(participants));
    });

    socket.on("disconnect", function() {
        console.log("ON disconnect", socket.id);

        var participant = _.find(participants, {
            id: socket.id
        });
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

http.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
