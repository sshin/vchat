"use strict";

/** app settings **/
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var Session = require('express-session'), RedisStore = require('connect-redis')(Session);
var connect = require('connect');
var credentials = require('credentials');
var bodyParser = require('body-parser');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var session = Session({
  store: new RedisStore({
    host: 'localhost', port: 6379, db: 10, ttl: 3600, secret: credentials.redisSecret
  }),
  secret: credentials.sessionSecret,
  cookie: {path: '/', domain: 'nullcannull-dev.net'},
  key: credentials.sessionKey,
  resave: true,
  saveUninitialized: true
});
app.use(session);
var server = app.listen(21000, () => {
  console.log('[Warm up Log] Socket server started and listening on port %d', server.address().port);
});


/** Socket specific **/
var childProcess = require('child_process');
var RoombeatController = require('./controllers/roombeat').RoombeatController;
var io = require('socket.io').listen(server);
io.use((socket, next) => {
  session(socket.handshake, {}, next);
});


/** Whatever... **/
app.get('/', (req, res) => {
  res.send('vChat socket server.');
});


/** Socket Handler **/
var redis = require('redis');
var redisClients = {};
// For session related works.
redisClients['session'] = redis.createClient();
redisClients['session'].select(10, () => {
  console.log('[Warm up Log] Selecting Redis database 10 for vChat: socket session client');
});
// For room related works.
redisClients['room'] = redis.createClient();
redisClients['room'].select(11, () => {
  console.log('[Warm up Log] Selecting Redis database 11 for vChat: socket room client');
});
// For video related works.
redisClients['video'] = redis.createClient();
redisClients['video'].select(12, () => {
  console.log('[Warm up Log] Selecting Redis database 12 for vChat: socket video client');
});
// For video queue.
redisClients['videoQueue'] = redis.createClient();
redisClients['videoQueue'].select(13, () => {
  console.log('[Warm up Log] Selecting Redis database 13 for vChat: socket video queue client');
});
// For task queue.
redisClients['taskQueue'] = redis.createClient();
redisClients['taskQueue'].select(14, () => {
  console.log('[Warm up Log] Selecting Redis database 14 for vChat: socket task queue client');
});


/**
 * Roombeat!!
 */
var child = childProcess.fork('./roombeat.js');
var roombeatCtrl = new RoombeatController(redisClients, io);
child.on('message', (message) => {
  roombeatCtrl.currentVideoEnded(message)
});


/*** Clear Redis entries during testing ***/
for (let i = 0; i < process.argv.length; i++) {
  switch(process.argv[i]) {
   case 'clear':
     console.log('[Warm up Log] Clearing up Redis key/values on socket server start.');
     redisClients['room'].flushdb();
     redisClients['video'].flushdb();
     redisClients['videoQueue'].flushdb();
     redisClients['taskQueue'].flushdb();
     break;
  }
}


var SocketController = require('./controllers/socket').SocketController;

/**
 * Main socket handler.
 *
 * NOTE: For current socket's specific events, declare a function inside closure,
 * and use that function instead of declaring a method in SocketController.
 * And remove listeners for all socket specific functions on disconnect.
 *
 */
io['sockets'].on('connection', function (socket) {

  var socketCtrl = new SocketController(io, redisClients, socket);

  socket.on('client-chat-send', (data) => {
    socketCtrl.chatFromClient(data);
  });

  socket.on('new-video-submit', (data) => {
    socketCtrl.newVideoSubmit(data);
  });

  socket.on('control-video', (data) => {
    socketCtrl.controlVideo(data);
  });

  socket.on('get-current-play-time-for-new-user', (data) => {
    socketCtrl.getCurrentPlayTimeForNewUser(data);
  });

  socket.on('current-play-time-for-new-user', (data) => {
    socketCtrl.playCurrentVideoForNewUser(data);
  });

  socket.on('pop-out-user', () => {
    socketCtrl.notifyPopOutUser();
  });


  socket.on('disconnect', () => {
    // Remove all listeners.
    socket.removeAllListeners('client-chat-send');
    socket.removeAllListeners('new-video-submit');
    socket.removeAllListeners('control-video');
    socket.removeAllListeners('get-current-play-time-for-new-user');
    socket.removeAllListeners('current-play-time-for-new-user');
    socket.removeAllListeners('pop-out-user');
    socketCtrl.leave();
  });
});


