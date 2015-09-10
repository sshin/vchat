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

    constructor(redisClient, redisClient2, redisClient3, roomHash) {
        this._redisRoomsClient = redisClient;
        this._redisDataClient = redisClient2;
        this._redisVideoClient = redisClient3;
        this._videoKey = Constants.redisVideoKeyPrefix + roomHash;
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

            // If no user left in the room, remove the entry. It's a memory sucker.
            if (data['usersCount'] === 0) {
                let videoData = {
                    currentVideo: null,
                    queue: []
                };
                this._redisVideoClient.del(this._videoKey);
            }
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


    /***** Video related methods *****/
    /*
     * See if there is a video currently playing, and return video id if so.
     */
    checkVideoPlaying(callback) {
        this._get(this._redisVideoClient, this._videoKey, (data) => {
            if (data !== null && data.currentVideo !== null) {
                callback(data.currentVideo['videoId']);
            }
        });
    }


    /* 
     * Queue new video into Redis. If it is very first for the room,
     * create a new entry in Redis.
     * If there is no video currently playing, then play the first one in queue.
     */
    queueVideo(videoData, callback, playVideoCallback) {
        // TODO: Maybe implement real queue, instead of using Array.
        this._get(this._redisVideoClient, this._videoKey, (data) => {
            if (data == null) {
                // Very first video.
                let newData = {
                    currentVideo: null,
                    queue: [videoData]
                };
                this._set(this._redisVideoClient, this._videoKey, newData, () => {
                    // Since this is the very first video, it must playNextVideo.
                    callback();
                    this.playNextVideo(playVideoCallback);
                });
            } else {
                data.queue.push(videoData);
                if (data.currentVideo == null) {
                    // No video currently playing, so set and play next video.
                    let nextVideo = data.queue.shift();
                    data.currentVideo = nextVideo;
                    this._set(this._redisVideoClient, this._videoKey, data, () => {
                        callback();
                        this.playNextVideo(playVideoCallback);
                    });
                } else {
                    this._set(this._redisVideoClient, this._videoKey, data, () => {
                        callback();
                    });
                }
            }
        });
    }

    /* Play the next video from the queue. */
    playNextVideo(callback) {
        this._get(this._redisVideoClient, this._videoKey, (data) => {
            let videoData = data;
            let nextVideo = videoData.queue.shift();
            if (nextVideo) {
                videoData.currentVideo = nextVideo;
                this._set(this._redisVideoClient, this._videoKey, videoData, () => {
                    if (typeof callback === 'function') callback(nextVideo);
                });
            } else {
                callback(null);
            }
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

