"use strict";

var Controller = require('./controller').Controller;
var Room = require('../models/room').Room;
var RelatedVideo = require('../models/related_video').RelatedVideo;
var Constants = require('../app_modules/constants');
var SocketVideoQueueController = require('./socket_video_queue').SocketVideoQueueController;
var co = require('co');


class SocketRedisController extends Controller {
  /**
   * RedisController for vchat-socket server.
   * Never throw errors on redis error, because we don't want to restart socket server.
   * Find a way to handle errors.
   *
   * NOTE: This controller is socket & room specific and it's binded with SocketController.
   */

  constructor(redisClients, roomHash, roomKey, videoKey) {
    super();
    this._redisRoomsClient = redisClients['room'];
    this._redisVideoClient = redisClients['video'];
    this._redisVideoQueueClient= redisClients['videoQueue'];
    this._roomHash = roomHash;
    this._roomKey = roomKey;
    this._videoKey = videoKey;
    this._socketVideoQueueCtrl = new SocketVideoQueueController(redisClients['videoQueue'],
                                                                 this._videoKey);
  }

  /**
   * Add user to the room, and update all associated Redis entries.
   * If this user is the first user of the room, create new Redis entries.
   *
   * Returns
   *  resolve: empty.
   */
  addUserToRoom(user) {
    var promise = new Promise((resolve, reject) => {
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
            roomData['users'][user['socketId']] = user;
            roomData['usersCount'] = 1;
            roomData['pendingWipeOut'] = false;
            this.setRoom(roomData).then(() => {
              this._increaseRoomCount(roomData['private']);
              resolve();
            });
          });
        } else if (data['usersCount'] === 0) {
        // Room has been reactivated.
          let roomData = data;
          roomData['users'][user['socketId']] = user;
          roomData['usersCount'] = 1;
          this.setRoom(roomData).then(resolve);
        } else {
        // Adding user to an existing room.
          if (!data['users'].hasOwnProperty(user['socketId'])) {
            data['users'][user['socketId']] = user;
            data['usersCount'] = parseInt(data['usersCount']) + 1;
          }
          this.setRoom(data).then(resolve);
        }
        this._increaseTotalUserCount();
      });
    });
    return promise;
  }

  /**
   * Remove user from room and update all associated Redis entries.
   */
  removeUserFromRoom(user) {
    this.getRoom().then((data) => {
      delete data['users'][user['socketId']];
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
        this._redisVideoQueueClient.del(this._videoKey);
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
    return this._get('room', this._roomKey);
  }

  setRoom(data) {
    return this._set('room', this._roomKey, data);
  }

  getVideoData() {
    return this._get('video', this._videoKey);
  }

  setVideoData(data) {
    return this._set('video', this._videoKey, data);
  }

  _increaseRoomCount(isPrivate) {
    var key = isPrivate ? Constants.privateRoomsCount : Constants.publicRoomsCount;
    this._updateCount(key, 1);
  }

  _decreaseRoomCount(isPrivate) {
    var key = isPrivate ? Constants.privateRoomsCount : Constants.publicRoomsCount;
    this._updateCount(key, -1);
  }

  _increaseTotalUserCount() {
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
   * Queue new video into Redis.
   * If it is the very first video for the room, play it right after queueing.
   *
   * Returns
   *   resolve: boolean, if client should play the queued video.
   *   reject: if submitted video is the same video with last queued video.
   */
  queueVideo(videoData) {
    var promise  = new Promise((resolve, reject) => {
      this.getVideoData().then((data) => {
        if (data == null) {
        // Very first video.
          let newData = {
            currentVideo: null,
            searchingRelatedVideo: false,
            relatedVideos: {length: 0, videos: {}}
          };
          this.setVideoData(newData).then(() => {
            this._socketVideoQueueCtrl.queue(videoData).then(() => resolve(true));
          });
        } else {
        // Not a first video for the room.
          this._socketVideoQueueCtrl.tpeek().then((lastQueuedVideo) => {
            let lastQueued = false;

            if (lastQueuedVideo === null) {
            // Queue is empty, so check if submitted video is same as the current playing one.
              lastQueued = data['currentVideo'] !== null &&
                           data['currentVideo']['videoId'] === videoData['videoId'];
            } else {
              lastQueued = videoData['videoId'] === lastQueuedVideo['videoId'];
            }

            if (lastQueued) {
              this.logger.log('submitted same video with the last queued video | canceling queue |'
                              + ' submit type: ' + videoData['submitType']
                              + ' | videoId: ' + videoData['videoId']
                              + ' | room: ' + this._roomHash);
              reject();
            } else {
            // Queue the video.
              this.logger.log('queuing a video | submit type: ' + videoData['submitType']
                              + ' | videoId: ' + videoData['videoId']
                              + ' | room: ' + this._roomHash);
              this._socketVideoQueueCtrl.queue(videoData);
              resolve();
            }
          });
        }
      });
    });
    return promise;
  }

  /**
   * Play the next video from the queue.
   *
   * Returns
   *  resolve: next video from the queue or null.
   */
  getNextVideo() {
    var promise = new Promise((resolve, reject) => {
      let currentVideoId = null;
      let nextVideoId = null;
      this._socketVideoQueueCtrl.pop().then((nextVideo) => {
        if (nextVideo !== null) {
          nextVideoId = nextVideo['videoId'];
          // Set the next video to current video.
          this.getVideoData().then((videoData) => {
            if (videoData['currentVideo'] !== null) {
              let score = Constants.USER_SELECTED_RELATED_VIDEO_SCORE;

              // Related videos are randomly selected videos from youtube's related videos search.
              if (nextVideo.hasOwnProperty('isRelatedVideo') && nextVideo['isRelatedVideo']) {
                score = Constants.RELATED_VIDEO_MIN_SCORE;
              }

              currentVideoId = videoData['currentVideo']['videoId'];
              RelatedVideo.saveRelatedVideo(currentVideoId, nextVideoId, score);
            }

            videoData['currentVideo'] = nextVideo;
            this.setVideoData(videoData);
          });
        }

        // No need to wait for updating the video data.
        resolve(nextVideo);
      });
    });
    return promise;
  }

  /***** Wrapper methods to abstract error handling *****/
  /**
   * Get data from Redis.
   *
   * Returns
   *  resolve: null or json parsed data.
   */
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

  /**
   * Set data to Redis.
   *
   * Returns
   *  resolve: empty.
   */
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

