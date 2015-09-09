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
        this.getRoom(roomHash, (data) => {
            if (!data) {
                // This user is the first user of the room.
                let room = new Room();
                room.select({
                    where: {
                        hash: roomHash
                    }
                }, (data) => {
                    let roomData = data[0];
                    roomData['users'] = {};
                    roomData['users'][user['id']] = user;
                    roomData['usersCount'] = 1;
                    this.setRoom(roomHash, roomData, () => {
                        this._updatevChatData(data, true);
                    });
                });
            } else {
                if (!data['users'].hasOwnProperty(user['id'])) {
                    data['users'][user['id']] = user;
                    data['usersCount'] = parseInt(data['usersCount']) + 1;
                }
                this.setRoom(roomHash, data, () => {
                    this._updatevChatData(data, true);
                });
            }
        });
    }

    /* 
     * Remove user from room and update all associated Redis entries. 
     */
    removeUserFromRoom(roomHash, user) {
        this.getRoom(roomHash, (data) => {
            delete data['users'][user['id']];
            data['usersCount'] = parseInt(data['usersCount']) - 1;
            this.setRoom(roomHash, data, () => {
                this._updatevChatData(data, false);
            });
        });
    }

    getRoom(roomHash, callback) {
        this._get(this._redisRoomsClient, roomHash, callback);
    }

    setRoom(roomHash, data, callback) {
        this._set(this._redisRoomsClient, roomHash, data, () => {
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
            (callback) => {
                this._get(this._redisDataClient, Constants.roomsCount, (data) => {
                    let count = parseInt(data);
                    count = userAdded ? count+1 : count-1;
                    this._set(this._redisDataClient, Constants.roomsCount, ''+count, () => {
                        callback();
                    });
                });
            },
            (callback) => {
                let key = isPublic ? Constants.publicRoomsCount : Constants.privateRoomsCount;
                this._get(this._redisDataClient, key, (data) => {
                    let count = parseInt(data);
                    count = userAdded ? count+1 : count-1;
                    this._set(this._redisDataClient, key, ''+count, () => {
                        callback();
                    });
                });
            }
        ], () => {
            // Done!!!
        });
    }


    /***** Wrapper methods to abstract error handling *****/
    _get(client, key, callback) {
        client.get(key, (err, data) => {
            if (err) {
                this._logger.redisError('Cannot get on RedisController');
            } else {
                let val = null;

                if (data) {
                    val = JSON.parse(data);
                }

                callback(val);
            }
        });
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

