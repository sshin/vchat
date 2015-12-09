"use strict";

var Controller = require('./controller').Controller;


class SocketSessionController extends Controller {

  constructor(io, redisClient, sessionKey, socketId) {
    super();
    this._io = io;
    this._redisClient = redisClient;
    this._key = sessionKey;
    this._socketId = socketId;
    this._init();
  }

  /**
   * Check if there is a connection already from the same client, and if there is, force disconnect
   * the old connection.
   */
  _init() {
    this.get('socketId').then((oldSocketId) => {
      if (oldSocketId !== null && this._io['sockets']['connected'].hasOwnProperty(oldSocketId)) {
        this.logger.log('detected a new connection from the same client'
                         + ' | disconnect old connection of socket id: ' + this._socketId);
        try {
          this._io['sockets']['connected'][oldSocketId].emit('force-disconnect');
        } catch (err) {
          // Do nothing.
        }
      }
      this.set('socketId', this._socketId);
    });
  }

  /**
   * Get value of the key in session, or return everything..
   */
  get(key) {
    var promise = new Promise((resolve, reject) => {
      this._get().then((data) => {
        if (typeof key !== 'undefined') {
          if (data.hasOwnProperty(key)) {
            resolve(data[key]);
          } else {
            resolve(null);
          }
        } else {
          resolve(data);
        }
      });
    });
    return promise;
  }

  _get() {
    var promise = new Promise((resolve, reject) => {
      this._redisClient.get(this._key, (err, data) => {
        if (err) {
          reject();
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    return promise;
  }

  /**
   * Set key/value to session.
   */
  set(key, value) {
    var promise = new Promise((resolve, reject) => {
      this._get().then((data) => {
        data[key] = value;
        this._redisClient.set(this._key, JSON.stringify(data), (err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
      });
    });
    return promise;
  }

}


exports.SocketSessionController = SocketSessionController;
