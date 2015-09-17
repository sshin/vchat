/* app settings */
var APP_URL = 'http://vchat.nullcannull-dev.net/';
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var credentials = require('credentials');
var Constants = require('./app_modules/constants');
var server = app.listen(21500, () => {
  console.log('Socket roombeat server started and listening on port %d', server.address().port);
});
var io = require('socket.io').listen(server);

/* What ever... */
app.get('/', (req, res) => {
  res.send('vChat socket roombeat server.');
});


/* Socket Handler */
var redis = require('redis');
var redisClient = redis.createClient();
redisClient.select(10, () => {
  console.log('Selecting Redis database 10 for vChat: socket-roombeat');
});
redisClient.on('error', (err) => {
  console.log('Redis Error: ' + err);
});

io.on('connection', function (socket) {
  var roomHash = _getRoomHash(socket);
  var roomKey = Constants.redisRoomKeyPrefix + roomHash;
  var videoKey = Constants.redisVideoKeyPrefix + roomHash;
  socket.join(roomKey);

  socket.on('roombeat', (data) => {
    if (data['isVideoEnded']) {
      let videoData = {
        videoEnded: true,
        videoKey: videoKey,
        videoId: data['videoId'],
        roomKey: roomKey
      }
      process.send(JSON.stringify(videoData));
    }
  });
});

/* 
 * Parse room hash from socket object. 
 */
function _getRoomHash(socket) {
  var referer = socket.handshake.headers.referer;
  referer = referer.split('/');
  return referer[referer.length - 1];
}


/*
 * Roombeat happens here!
 */
(function roomBeat() {

  let rooms = io.sockets.adapter.rooms;
  for (var key in rooms) {
    // Skip individual socket rooms.
    if (!key.startsWith(Constants.redisRoomKeyPrefix)) continue;
    let sockets = io.sockets.adapter.rooms[key];
    for (var socketKey in sockets) {
      if (sockets[socketKey] === true) {
        try {
          // Just in case if this socket left the room in like 10ms...
          io.sockets.connected[socketKey].emit('roombeat');
          break;
        } catch (err) {
          // Continue looping..
        }
      }
    }
  }

  setTimeout(roomBeat, 3000);
})();



