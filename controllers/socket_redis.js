"use strict";

var Controller = require('./controller').Controller;
var Room = require('../models/room').Room;
var Constants = require('../app_modules/constants');


class SocketRedisController extends Controller {
  /**
   * RedisController for vchat-socket server.
   * Never throw errors on redis error, because we don't want to restart socket server.
   * Find a way to handle errors.
   *
   * NOTE: This controller is socket & room specific and it's binded with SocketController.
   */

  constructor(redisClient, redisClient2, roomHash) {
    super();
    this._redisRoomsClient = redisClient;
    this._redisVideoClient = redisClient2;
    this._roomHash = roomHash;
    this._roomKey = Constants.redisRoomKeyPrefix + roomHash;
    this._videoKey = Constants.redisVideoKeyPrefix + roomHash;
  }

  /**
   * Add user to the room, and update all associated Redis entries.
   * If this user is the first user of the room, create new Redis entries.
   */
  addUserToRoom(user) {
    this.getRoom((data) => {
      if (!data) {
        // This user is the first user of the room.
        let room = new Room();
        room.select({
          where: {
            hash: this._roomHash
          }
        }).then((data) => {
          let roomData = data[0];
          roomData['users'] = {};
          roomData['users'][user['id']] = user;
          roomData['usersCount'] = 1;
          this.setRoom(roomData, () => {
            this._increaseRoomCount(roomData['private']);
          });
        });
      } else {
        if (!data['users'].hasOwnProperty(user['id'])) {
          data['users'][user['id']] = user;
          data['usersCount'] = parseInt(data['usersCount']) + 1;
        }
        this.setRoom(data);
      }
      this._increaseUserCount();
    });
  }

  /**
   * Remove user from room and update all associated Redis entries.
   */
  removeUserFromRoom(user) {
    this.getRoom((data) => {
      delete data['users'][user['id']];
      data['usersCount'] = parseInt(data['usersCount']) - 1;
      this.setRoom(data);

      // If no user left in the room, empty out all records.
      if (data['usersCount'] === 0) {
        this._redisRoomsClient.del(this._roomKey);
        this._redisVideoClient.del(this._videoKey);
        this._decreaseRoomCount(data['private']);
        let room = new Room();
        room.deleteRoom(this._roomHash);
      }
      this._decreaseUserCount();
    });
  }

  getRoom(callback) {
    this._get(this._redisRoomsClient, this._roomKey).then(callback);
  }

  setRoom(data, callback) {
    this._set(this._redisRoomsClient, this._roomKey, data).then(() => {
      if (typeof callback !== 'undefined') callback();
    });
  }

  _increaseRoomCount(isPrivate) {
    var key = isPrivate ? Constants.privateRoomsCount : Constants.publicRoomsCount;
    this._updateCount(key, 1);
  }

  _decreaseRoomCount(isPrivate) {
    var key = isPrivate ? Constants.privateRoomsCount : Constants.publicRoomsCount;
    this._updateCount(key, -1);
  }

  _increaseUserCount() {
    this._updateCount(Constants.userCount, 1);
  }

  _decreaseUserCount() {
    this._updateCount(Constants.userCount, -1);
  }

  _updateCount(key, change) {
    this._get(this._redisRoomsClient, key).then((data) => {
      let count = parseInt(data);
      if (count == null || isNaN(count)) count = 0;
      count = count + (change);
      if (count < 0) count = 0;
      this._redisRoomsClient.set(key, '' + count);
    });
  }

  /***** Video related methods *****/
  /**
   * See if there is a video currently playing, and return video id if so.
   */
  checkVideoPlaying(callback) {
    this._get(this._redisVideoClient, this._videoKey).then((data) => {
      if (data !== null && data['currentVideo'] !== null) {
        callback(data['currentVideo']['videoId']);
      }
    });
  }


  /**
   * Queue new video into Redis. If it is very first for the room,
   * create a new entry in Redis.
   * If there is no video currently playing, then play the first one in queue.
   */
  queueVideo(videoData, callback, playVideoCallback) {
    this._get(this._redisVideoClient, this._videoKey).then((data) => {
      if (data == null) {
        // Very first video.
        let newData = {
          currentVideo: null,
          queue: [videoData],
          searchingRelatedVideo: false,
          relatedVideos: {length: 0, videos: {}}
        };
        this._set(this._redisVideoClient, this._videoKey, newData).then(() => {
          // Since this is the very first video, it must playNextVideo.
          callback();
          this.playNextVideo(playVideoCallback);
        });
      } else {
        data.queue.push(videoData);
        if (data['currentVideo'] == null && !data['searchingRelatedVideo']) {
          // No video currently playing, so set and play the next video.
          let nextVideo = data['queue'].shift();
          data['currentVideo'] = nextVideo;
          this._set(this._redisVideoClient, this._videoKey, data).then(() => {
            callback();
            this.playNextVideo(playVideoCallback);
          });
        } else {
          this._set(this._redisVideoClient, this._videoKey, data).then(() => {
            callback();
          });
        }
      }
    });
  }

  /** Play the next video from the queue. **/
  playNextVideo(callback) {
    this._get(this._redisVideoClient, this._videoKey).then((data) => {
      let videoData = data;
      let nextVideo = videoData['queue'].shift();
      if (nextVideo) {
        videoData['currentVideo'] = nextVideo;
        this._set(this._redisVideoClient, this._videoKey, videoData).then(() => {
          callback(nextVideo)
        });
      } else {
        callback(null);
      }
    });
  }

  /***** Wrapper methods to abstract error handling *****/
  _get(client, key) {
    var promise = new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) {
          this.logger.redisError('Cannot get on RedisController');
          reject();
        } else {
          let val = null;

          if (data) {
            val = JSON.parse(data);
          }

          resolve(val);
        }
      });
    });
    return promise;
  }

  _set(client, key, data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    var promise = new Promise((resolve, reject) => {
      client.set(key, data, () => resolve());
    });
    return promise;
  }

}


exports.SocketRedisController = SocketRedisController;

