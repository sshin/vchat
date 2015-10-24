var mysql = require('mysql');
var credentials = require('credentials');

var pool = mysql.createPool({
  connectionLimit: 1,
  host: 'localhost',
  user: credentials.mysqlUsername,
  password: credentials.mysqlPassword,
  database: credentials.mysqlDatabase
});


var redis = require('redis');
var redisClient = redis.createClient();
redisClient.select(10, () => {
  console.log('Selecting Redis database 10 for vChat: App session');
});
redisClient.on('error', (err) => {
  console.log('Redis Error: ' + err);
});
var redisRoomClient = redis.createClient();
redisRoomClient.select(11, () => {
  console.log('Selecting Redis database 11 for vChat: App room client');
});
redisRoomClient.on('error', (err) => {
  console.log('Redis Error: ' + err);
});


exports.pool = pool;
exports.redisClient = redisClient;
exports.redisRoomClient = redisRoomClient;


