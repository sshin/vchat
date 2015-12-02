"use strict";

/* app settings */
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session'), RedisStore = require('connect-redis')(session);
var connect = require('connect');
var credentials = require('credentials');
var bodyParser = require('body-parser');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
  store: new RedisStore({
    host: 'localhost', port: 6379, db: 10, ttl: 3600, secret: credentials.redisSecret
  }),
  secret: credentials.sessionSecret,
  key: credentials.sessionKey,
  resave: true,
  saveUninitialized: true
}));
var server = app.listen(20000, () => {
  console.log('[Warm up Log] Server started on port %d', server.address().port);
});


/** database and redis initiate **/
/** Clear Room table on server start. **/
for (let i = 0; i < process.argv.length; i++) {
  switch(process.argv[i]) {
   case 'clear-room':
      let Room = require('./models/room').Room;
      let room = new Room();
      console.log('[Warm up Log] Clearing up Room table on server start.');
      room.clearRoom();
      break;
    case 'clear-user':
      let User = require('./models/user').User;
      let user = new User();
      console.log('[Warm up Log] Clearing up User table on server start.');
      user.runQuery('DELETE FROM User');
    case 'clear-uvl':
      let UserVideoList = require('./models/user_video_list').UserVideoList;
      let uvl = new UserVideoList();
      console.log('[Warm up Log] Clearing up UserVideoTable table on server start.');
      uvl.runQuery('DELETE FROM UserVideoList');
      break;
  }
}


/** Router **/
require('./router')(app);
