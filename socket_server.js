
/* app settings */
var APP_URL = 'http://vchat.nullcannull-dev.net/';
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var credentials = require('credentials');
var server = app.listen(21000, () => {    
    console.log('Socket server started and listening on port %d', server.address().port);
});
var io = require('socket.io').listen(server);

/* What ever... */
app.get('/', (req, res) => {
    res.send('vChat socket server.');
});


/* Socket Handler */
var redis = require('redis');
var redisClient = redis.createClient();
redisClient.select(10, () => {
    console.log('Selecting Redis database 10 for vChat: socket');
});
redisClient.on('error', (err) => {
    console.log('Redis Error: ' + err);
});
// For room related works.
var socketCtrlRedisClient = redis.createClient();
socketCtrlRedisClient.select(10, () => {
    console.log('Selecting Redis database 10 for vChat: socket: socketCtrlRedisClient');
});
socketCtrlRedisClient.on('error', (err) => {
    console.log('Redis Error: ' + err);
});
// For data related works.
var socketCtrlRedisClient2 = redis.createClient();
socketCtrlRedisClient2.select(10, () => {
    console.log('Selecting Redis database 10 for vChat: socket: socketCtrlRedisClient2');
});
socketCtrlRedisClient2.on('error', (err) => {
    console.log('Redis Error: ' + err);
});
// For video related works.
var socketCtrlRedisClient3 = redis.createClient();
socketCtrlRedisClient3.select(10, () => {
    console.log('Selecting Redis database 10 for vChat: socket: socketCtrlRedisClient3');
});
socketCtrlRedisClient3.on('error', (err) => {
    console.log('Redis Error: ' + err);
});



/*** Clear Redis entries during testing ***/
redisClient.set('APP total:rooms', '0');
redisClient.set('APP total:public_rooms', '0');
redisClient.set('APP total:private_rooms', '0');
redisClient.del('test-1');
redisClient.del('VIDEO test-1');


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

    var socketCtrl = new SocketController(io, 
        socketCtrlRedisClient, socketCtrlRedisClient2, socketCtrlRedisClient3,
        socket);

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

    socket.on('current-play-time-for-new-user', (data) =>{
        socketCtrl.playCurrentVideoForNewUser(data);
    });

 
    socket.on('disconnect', () => {
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


