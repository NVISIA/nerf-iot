var io = require('socket.io-client'),
    assert = require('assert'),
    expect = require('expect.js');

describe('Nerf WebSocket tests', function() {

    var socket;

    beforeEach(function(done) {
        socket = io.connect('http://localhost:3000', {
            'reconnection delay': 0,
            'reopen delay': 0,
            'force new connection': true,
            'multiplex': false
        });
        socket.on('connect', function() {
            console.log('connected...');
            done();
        });

        socket.on('new_connection', function(data) {console.log('new_connection', data);});
        socket.on('name_changed', function(data) {console.log('name_changed', data);});
        socket.on('spun_up', function(data) {console.log('spun_up', data);});
        socket.on('spun_down', function(data) {console.log('spun_down', data);});
        socket.on('fired_on', function(data) {console.log('fired_on', data);});
        socket.on('fired_off', function(data) {console.log('fired_off', data);});
        socket.on('user_disconnected', function(data) {console.log('user_disconnected', data);});
    });

    afterEach(function(done) {
        console.log('disconnecting...');
        socket.disconnect();
        done();
    });

    describe('Running some socket tests', function() {
        it('Spin up and fire', function(done) {
            setTimeout(function(){socket.emit('spin_up');}, 100);
            setTimeout(function(){socket.emit('fire_on');}, 200);
            setTimeout(function(){socket.emit('fire_off');}, 300);
            setTimeout(function(){socket.emit('spin_down');}, 400);
            setTimeout(function(){socket.emit('name_change', {name: 'Ada Lovelace'});}, 500);
            setTimeout(function(){done();}, 1000);
        });
    });
});
