
/* app settings */
var APP_URL = 'http://vchat.nullcannull-dev.net/';
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var credentials = require('credentials');
var server = app.listen(21000, function() {
    console.log('Socket server started and listening on port %d', server.address().port);
});
var io = require('socket.io').listen(server);

/* What ever... */
app.get('/', function(req, res) {
    res.send('vChat socket server.');
});


/* Socket Handler */
var redis = require('redis');
var redisClient = redis.createClient();
redisClient.select(10, function(){
    console.log('Selecting Redis database 10 for vChat: socket');
});
redisClient.on('error', function(err) {
    console.log('Redis Error: ' + err);
});
var socketCtrlRedisClient = redis.createClient();
socketCtrlRedisClient.select(10, function() {
    console.log('Selecting Redis database 10 for vChat: socket: socketCtrlRedisClient');
});
socketCtrlRedisClient.on('error', function(err) {
    console.log('Redis Error: ' + err);
});
var socketCtrlRedisClient2 = redis.createClient();
socketCtrlRedisClient2.select(10, function() {
    console.log('Selecting Redis database 10 for vChat: socket: socketCtrlRedisClient2');
});
socketCtrlRedisClient2.on('error', function(err) {
    console.log('Redis Error: ' + err);
});


/*** Clear Redis entries during testing ***/
redisClient.set('APP total:rooms', '0');
redisClient.set('APP total:public_rooms', '0');
redisClient.set('APP total:private_rooms', '0');
redisClient.del('test-1');



var SocketController = require('./controllers/socket').SocketController;

/*
 * Main socket handler.
 *
 * NOTE: For current socket's specefic events, declare a function inside closure,
 * and use that function instead of declaring a method in SocketController.
 * And remove listeners for all socket specific functions on disconnect.
 *
 */
io.sockets.on('connection', function(socket) {

    var socketCtrl = new SocketController(io, socketCtrlRedisClient, socketCtrlRedisClient2, socket);

    socket.on('client-chat-send', function(data) {
        socketCtrl.chatFromClient(data);
    });

    socket.on('new-video-submit', function(data) {
        socketCtrl.newVideoSubmit(data);
    });
    
    socket.on('control-video', function(data) {
        socketCtrl.controlVideo(data);
    });
    
    
    socket.on('disconnect', function() {
    /* Remove all event handlers that are socket specific.
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


