"use strict";

var DBPools = require('./db_pool');
var Logger = require('../app_modules/logger');


class Redis {

  constructor() {
    this._redisClient = DBPools.redisClient;
    this._redisRoomClient = DBPools.redisRoomClient;
    this.logger = new Logger();
  }

  /**
   * Grabs redis client.
   *
   * NOTE: Use let instead of var where you call this method,
   * so we can immediately release it.
   */
  getRedisClient() {
    return this._redisClient;
  }

  /**
   * Grabs redis room client.
   *
   * NOTE: Use let instead of var where you call this method,
   * so we can immediately release it.
   */
  getRedisRoomClient() {
    return this._redisRoomClient;
  }

  /**
   * Get data from Redis.
   */
  redisGet(key) {
    var promise = new Promise((resolve, reject) => {
      this._redisClient.get(key, (err, data) => {
        if (err) {
          this.logger.redisError('Error on get for key: ' + key);
          reject();
        } else {
          resolve(data);
        }
      });
    });
    return promise;
  }

  /**
   * Set key/value on Redis.
   */
  redisSet(key, value) {
    var promise = new Promise((resovle, reject) => {
      this._redisClient.set(key, value, (err) => {
        if (err) {
          this.logger.redisError('Error on get for key: ' + key);
          reject();
        } else {
          resolve();
        }
      });
    });
    return promise;
  }

  /**
   * Get room data from Redis.
   */
  redisRoomGet(key) {
    var promise = new Promise((resolve, reject) => {
      this._redisRoomClient.get(key, (err, data) => {
        if (err) {
          this.logger.redisError('Error on get for key: ' + key);
          reject();
        } else {
          resolve(data);
        }
      });
    });
    return promise;
  }

  /**
   * Set room key/value on Redis.
   */
  redisRoomSet(key, value) {
    var promise = new Promise((resovle, reject) => {
      this._redisRoomClient.set(key, value, (err) => {
        if (err) {
          this.logger.redisError('Error on get for key: ' + key);
          reject();
        } else {
          resolve();
        }
      });
    });
    return promise;
  }
}

exports.Redis = Redis;
