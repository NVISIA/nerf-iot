'use strict';

var http = require('http'),
    _ = require('lodash'),
    SocketMaster = require('./socket-master.js');

var API = module.exports = function(opts) {
  if (opts == null) {
    opts = {};
  }

  this.mcp = opts.mcp;

  _.forEach(this.defaults, function(def, name) {
    this[name] = _.has(opts, name) ? opts[name] : def;
  }, this);
};

API.prototype.defaults = {
  name: 'socketio',
  host: '127.0.0.1',
  port: '3000',
  auth: false,
  CORS: '*:*',
};

API.prototype.start = function(app, onConnect) {
  this.createServer(app, onConnect);
  this.listen();
};

API.prototype.createServer = function createServer(app, onConnect) {
  this.server = this.http = http.createServer(app);
  this.sm = this._newSM(onConnect);
};

API.prototype.listen = function() {
  this.server.listen(this.port, function() {
    this.sm.start();
    this.sm.io.set('origins', this.CORS || '*:*');
    console.log('SocketIO server listening at ' + this.host + ':' + this.port);
  }.bind(this));
};

API.prototype._newSM = function(onConnect) {
  return new SocketMaster(this.http, this.mcp, onConnect);
};
