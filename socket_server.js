/** app settings **/
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var credentials = require('credentials');
var server = app.listen(21000, () => {
  console.log('[Log] Socket server started and listening on port %d', server.address().port);
});
var childProcess = require('child_process');
var RoombeatController = require('./controllers/roombeat').RoombeatController;
var io = require('socket.io').listen(server);

/** Whatever... **/
app.get('/', (req, res) => {
  res.send('vChat socket server.');
});


/** Socket Handler **/
var redis = require('redis');
// For room related works.
var socketCtrlRedisRoomClient = redis.createClient();
socketCtrlRedisRoomClient.select(11, () => {
  console.log('[Log] Selecting Redis database 11 for vChat: socket room client');
});
socketCtrlRedisRoomClient.on('error', (err) => {
  console.log('[[Redis Error]] ' + err);
});
// For video related works.
var socketCtrlRedisVideoClient = redis.createClient();
socketCtrlRedisVideoClient.select(12, () => {
  console.log('[Log] Selecting Redis database 12 for vChat: socket video client');
});
socketCtrlRedisVideoClient.on('error', (err) => {
  console.log('[[Redis Error]] ' + err);
});


/**
 * Roombeat!!
 */
var child = childProcess.fork('./roombeat.js');
var roombeatCtrl = new RoombeatController(socketCtrlRedisVideoClient, io);
child.on('message', (message) => {
  roombeatCtrl.currentVideoEnded(message)
});


/*** Clear Redis entries during testing ***/
var Constants = require('./app_modules/constants');
console.log('[Log] Clearing up Redis key/values on socket server start.');
socketCtrlRedisRoomClient.flushdb();
socketCtrlRedisVideoClient.flushdb();


var SocketController = require('./controllers/socket').SocketController;

/**
 * Main socket handler.
 *
 * NOTE: For current socket's specefic events, declare a function inside closure,
 * and use that function instead of declaring a method in SocketController.
 * And remove listeners for all socket specific functions on disconnect.
 *
 */
io.sockets.on('connection', function (socket) {

  var socketCtrl = new SocketController(io,
      socketCtrlRedisRoomClient, socketCtrlRedisVideoClient, socket);

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


  socket.on('disconnect', () => {
    /**
     * Remove all event handlers that are socket specific.
     * e.g., 
     *
     * function eventHandler(data) {
     *     socket.emit('example', data);
     * }
     *
     * socket.on('some-event', eventHandler);
     *
     *
     * And on disconnect...
     * socket.removeListener('some-event', eventHandler)
     */
    socketCtrl.leave();
  });

});


