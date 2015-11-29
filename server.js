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
var pool = require('./models/db_pool');
var Room = require('./models/room').Room;
var room = new Room();
/** Clear Room table on server start. **/
console.log('[Warm up Log] Clearing up Room table on server start.');
room.clearRoom();


/** Router **/
require('./router')(app);
