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
    this.getRoom().then((data) => {
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
          roomData['pendingWipeOut'] = false;
          this.setRoom(roomData).then(() => {
            this._increaseRoomCount(roomData['private']);
          });
        });
      } else if (data['usersCount'] === 0) {
      // Room has been reactivated.
        let roomData = data;
        roomData['users'][user['id']] = user;
        roomData['usersCount'] = 1;
        this.setRoom(roomData);
      } else {
      // Adding user to an existing room.
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
    this.getRoom().then((data) => {
      delete data['users'][user['id']];
      data['usersCount'] = parseInt(data['usersCount']) - 1;

      if (data['usersCount'] === 0 && !data['pendingWipeOut']) {
      // If no user left in the room, get ready to wipe out data.
        this.logger.log('last user left for the room: ' + this._roomHash
                         + ' | wiping out if inactive after 1 minute');

        // Start wipe out process.
        data['pendingWipeOut'] = true;

        setTimeout(() => {
          this._wipeOutRoom();
          // 1 minute for reactivating the room.
        }, 60000);
      }

      this._decreaseUserCount();
      this.setRoom(data);
    });
  }

  _wipeOutRoom() {
    this.getRoom().then((data) => {
      if (data === null) {
      // If room is already wiped out, then don't do anything.
        return;
      }

      if (data['usersCount'] === 0) {
      // Room has been inactive for 1 minute, so totally wipe out data.
        this.logger.log('room has been inactive for 1 minute'
                         + ' | wiping out data for room: ' + this._roomHash);
        this._redisRoomsClient.del(this._roomKey);
        this._redisVideoClient.del(this._videoKey);
        this._decreaseRoomCount(data['private']);
        let room = new Room();
        room.deleteRoom(this._roomHash);
      } else {
        this.logger.log('room has been reactivated'
                         + ' | canceling wipe out for room: ' + this._roomHash);
        data['pendingWipeOut'] = false;
        this.setRoom(data);
      }
    });
  }

  getRoom() {
    var promise = new Promise((resolve, reject) => {
      this._get('room', this._roomKey).then(resolve);
    });
    return promise;
  }

  setRoom(data) {
    var promise = new Promise((resolve, reject) => {
      this._set('room', this._roomKey, data).then(resolve);
    });
    return promise;
  }

  getVideoData() {
    var promise = new Promise((resolve, reject) => {
      this._get('video', this._videoKey).then(resolve);
    });
    return promise;
  }

  setVideoData(data) {
    var promise = new Promise((resolve, reject) => {
      this._set('video', this._videoKey, data).then(resolve);
    });
    return promise;
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
    this._get('room', key).then((data) => {
      let count = parseInt(data);
      if (count == null || isNaN(count)) count = 0;
      count = count + (change);
      if (count < 0) count = 0;
      this._set('room', key, '' + count);
    });
  }

  /***** Video related methods *****/
  /**
   * Queue new video into Redis. If it is very first for the room,
   * create a new entry in Redis.
   * If there is no video currently playing, then play the first one in queue.
   */
  queueVideo(videoData) {
    var promise  = new Promise((resolve, reject) => {
    // resolve param: boolean, if client should play the queued video.
    // reject: if submitted video is the same video with last queued video.
      this.getVideoData().then((data) => {
        if (data == null) {
        // Very first video.
          let newData = {
            currentVideo: null,
            queue: [videoData],
            searchingRelatedVideo: false,
            relatedVideos: {length: 0, videos: {}}
          };
          this.setVideoData(newData).then(() => {
            resolve(true);
          });
        } else {
        // Not a first video for the room.
          let queueLength = data['queue'].length;
          let lastQueued = false;

          if (queueLength > 0) {
          // Check if submitted video is the same with last queued.
            lastQueued = data['queue'][queueLength - 1]['videoId'] === videoData['videoId'];
          } else {
          // Queue is empty. See if the submitted video is same with the currently playing video.
            lastQueued = data['currentVideo'] !== null &&
                         data['currentVideo']['videoId'] === videoData['videoId'];
          }

          if (lastQueued) {
            this.logger.log('submitted same video with the last queued video | canceling queue |'
                            + ' submit type: ' + videoData['submitType']
                            + ' | videoId: ' + videoData['videoId'] + ' | room: ' + this._roomHash);
            reject();
          } else {
          // Queue the video.
            let playVideo = false;
            this.logger.log('queuing a video | submit type: ' + videoData['submitType']
                            + ' | videoId: ' + videoData['videoId'] + ' | room: ' + this._roomHash);
            data.queue.push(videoData);
            if (data['currentVideo'] === null && !data['searchingRelatedVideo']) {
            // No video currently playing, so set and play the next video.
              let nextVideo = data['queue'].shift();
              data['currentVideo'] = nextVideo;
              playVideo = true;
            }

            this.setVideoData(data).then(() => {
              resolve(playVideo);
            });
          }
        }
      });
    });
    return promise;
  }

  /** Play the next video from the queue. **/
  playNextVideo(callback) {
    this.getVideoData().then((data) => {
      let videoData = data;
      let nextVideo = videoData['queue'].shift();
      if (nextVideo) {
        videoData['currentVideo'] = nextVideo;
        this.setVideoData(videoData).then(() => {
          callback(nextVideo)
        });
      } else {
        callback(null);
      }
    });
  }

  /***** Wrapper methods to abstract error handling *****/
  _get(type, key) {
    var promise = new Promise((resolve, reject) => {
      let client = type === 'room' ? this._redisRoomsClient : this._redisVideoClient;
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

  _set(type, key, data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    var promise = new Promise((resolve, reject) => {
      let client = type === 'room' ? this._redisRoomsClient : this._redisVideoClient;
      client.set(key, data, () => resolve());
    });
    return promise;
  }

}


exports.SocketRedisController = SocketRedisController;

