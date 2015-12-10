"use strict";

var Controller = require('./controller').Controller;

class SocketVideoQueueController extends Controller {

  constructor(redisClient, key) {
    super();
    this._redisClient = redisClient;
    this._key = key;
  }

  queue(videoData) {
    var promise = new Promise((resolve, reject) => {
      this._redisClient.rpush(this._key, JSON.stringify(videoData), () => {
        resolve();
      });
    });
    return promise;
  }

  pop() {
    var promise = new Promise((resolve, reject) => {
      this._redisClient.lpop(this._key, (err, data) => {
        resolve(JSON.parse(data));
      });
    });
    return promise;
  }

  peek() {
    var promise = new Promise((resolve, reject) => {
      this._redisClient.lrange(this._key, -1, -1, (err, data) => {
        if (data.length === 0) {
          resolve(null);
        } else {
          resolve(JSON.parse(data[0]));
        }
      });
    });
    return promise;
  }

}

exports.SocketVideoQueueController = SocketVideoQueueController;
