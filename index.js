var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var methodOverride = require('method-override');
var path = require('path');
var errorHandler = require('errorhandler');
var _ = require('lodash');
var Cylon = require('cylon');
var CylonSocket = require('./cylon-api-socketio');

// create and register the cylonjs plugin
var cylonSocketInstance = new CylonSocket({ host: '0.0.0.0', port: '3000' });
Cylon.api.instances.push(cylonSocketInstance);
cylonSocketInstance.start();

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}

var participants = [];
var spinning = null;
var firing = null;
var nameCounter = 1;
var self = this;

onConnect = function(io) {
    console.log("connection", socket.id);

    var newName = "Guest " + nameCounter++;
    var participant = { id: socket.id, name: newName };
    participants.push(participant);

    io.emit("new_connection", {
        participant: participant,
        sender: "system",
        created_at: new Date().toISOString(),
        participants: participants
    });
};

Cylon.robot({
    name: 'nerf-brains',
    connections: { edison: {adaptor: 'intel-iot'} },
    events: ['new_connection', 'name_changed', 'spun_up', 'spun_down', 'fired_on', 'fired_off', 'user_disconnected'],
    commands: function() {
        return {
            name_change: this.nameChange,
            spin_up: this.spinUp,
            spin_down: this.spinDown,
            fire_on: this.fireOn,
            fire_off: this.fireOff,
            disconnect: this.disconnect
        };
    },
    devices: {
        spinPin: { driver: 'direct-pin', pin: 4 },
        firePin: { driver: 'direct-pin', pin: 8 }
    },
    work: function() {
        this.spinPin.digitalWrite(0);
        this.firePin.digitalWrite(0);
    },
    nameChange: function(data) {
        console.log("name_change", data);
        var p = _.find(participants, {id: this.sck.id});
        p.name = data.name;
        this.emit("name_changed", p);
    },
    spinUp: function() {
        console.log("spin_up", this.sck.id);
        var p = _.find(participants, {id: this.sck.id});
        self.spinning = this.sck.id;
        this.spinPin.digitalWrite(1);
        this.emit("spun_up", p);
    },
    spinDown: function() {
        console.log("spin_down", this.sck.id);
        var p = _.find(participants, {id: this.sck.id});
        this.spinPin.digitalWrite(0);
        self.spinning = null;
        this.emit("spun_down", p);
    },
    fireOn: function() {
        console.log("fire_on", this.sck.id);
        var p = _.find(participants, {id: this.sck.id});
        this.firePin.digitalWrite(1);
        self.firing = this.sck.id;
        this.emit("fired_on", p);
    },
    fireOff: function() {
        console.log("fire_off", this.sck.id);
        var p = _.find(participants, {id: this.sck.id});
        this.firePin.digitalWrite(0);
        self.firing = null;
        this.emit("fired_off", p);
    },
    disconnect: function() {
        console.log("disconnect", this.sck.id);
        var participant = _.find(participants, {id: this.sck.id});
        if (self.firing == this.sck.id) {
            self.firing = null;
            this.firePin.digitalWrite(0);
        }
        if (self.spinning == this.sck.id) {
            self.spinning = null;
            this.spinPin.digitalWrite(0);
        }

        participants = _.without(participants, participant);
        this.emit("user_disconnected", {
            participant: participant,
            sender: "system",
            created_at: new Date().toISOString(),
            participants: participants
        });
    }
}).start(app, onConnect);
