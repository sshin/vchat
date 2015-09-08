var express = require('express');
var async = require('async');
var Logger = require('../app_modules/logger').Logger;
var Room = require('../models/room').Room;
var Constants = require('../app_modules/constants');


class SocketRedisController {
    /*
     * RedisController for vchat-socket server.
     * Never throw errors on redis error, because we don't want to restart socket server.
     * Find a way to handle errors.
     */

    constructor(redisClient, redisClient2) {
        this._redisRoomsClient = redisClient;
        this._redisDataClient = redisClient2;
        this._logger = new Logger();
    }

    /* 
     * Add user to the room, and update all associated Redis entries.
     * If this user is the first user of the room, create new Redis entries.
     */
    addUserToRoom(roomHash, user) {
        this.getRoom(roomHash, function(data) {
            if (!data) {
                // This user is the first user of the room.
                let room = new Room();
                room.select({
                    where: {
                        hash: roomHash
                    }
                }, function(data) {
                    let roomData = data[0];
                    roomData['users'] = {};
                    roomData['users'][user['id']] = user;
                    roomData['usersCount'] = 1;
                    this.setRoom(roomHash, roomData, function() {
                        this._updatevChatData(data, true);
                    }.bind(this));
                }.bind(this));
            } else {
                if (!data['users'].hasOwnProperty(user['id'])) {
                    data['users'][user['id']] = user;
                    data['usersCount'] = parseInt(data['usersCount']) + 1;
                }
                this.setRoom(roomHash, data, function() {
                    this._updatevChatData(data, true);
                }.bind(this));
            }
        }.bind(this));
    }

    /* 
     * Remove user from room and update all associated Redis entries. 
     */
    removeUserFromRoom(roomHash, user) {
        this.getRoom(roomHash, function(data) {
            delete data['users'][user['id']];
            data['usersCount'] = parseInt(data['usersCount']) - 1;
            this.setRoom(roomHash, data, function() {
                this._updatevChatData(data, false);
            }.bind(this));
        }.bind(this));
    }

    getRoom(roomHash, callback) {
        this._get(this._redisRoomsClient, roomHash, callback);
    }

    setRoom(roomHash, data, callback) {
        this._set(this._redisRoomsClient, roomHash, data, function() {
            if (typeof callback !== 'undefined') callback();
        });
    }
   
    /* 
     * Update all associated data.  
     */
    _updatevChatData(data, userAdded) {
        var isPublic = data['private'] ? true : false;
        if (typeof userAdded === 'undefined') userAdded = false;

        async.waterfall([
            function(callback) {
                this._get(this._redisDataClient, Constants.roomsCount, function(data) {
                    let count = parseInt(data);
                    count = userAdded ? count+1 : count-1;
                    this._set(this._redisDataClient, Constants.roomsCount, ''+count, function() {
                        callback();
                    });
                }.bind(this));
            }.bind(this),
            function(callback) {
                let key = isPublic ? Constants.publicRoomsCount : Constants.privateRoomsCount;
                this._get(this._redisDataClient, key, function(data) {
                    let count = parseInt(data);
                    count = userAdded ? count+1 : count-1;
                    this._set(this._redisDataClient, key, ''+count, function() {
                        callback();
                    });
                }.bind(this));
            }.bind(this)
        ], function() {
            // Done!!!
        });
    }


    /***** Wrapper methods to abstract error handling *****/
    _get(client, key, callback) {
        client.get(key, function(err, data) {
            if (err) {
                this._logger.redisError('Cannot get on RedisController');
            } else {
                let val = null;

                if (data) {
                    val = JSON.parse(data);
                }

                callback(val);
            }
        }.bind(this));
    }

    _set(client, key, data, callback) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }

        if (typeof callback === 'undefined') {
            callback = null;
        }

        client.set(key, data, callback);
    }

}



exports.SocketRedisController = SocketRedisController;

