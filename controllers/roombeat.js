"use strict";

var Controller = require('./controller').Controller;
var SocketRedisController = require('../controllers/socket_redis').SocketRedisController;
var SocketVideoQueueController = require('./socket_video_queue').SocketVideoQueueController;
var YouTubeAPIController = require('./youtube_api').YouTubeAPIController;
var co = require('co');
var Constants = require('../app_modules/constants');


class RoombeatController extends Controller {

  constructor(redisClients, io) {
    super();
    this._redisClients = redisClients;
    this._io = io;
  }

  /**
   * Roombeat detected that current video ended for a room.
   * If this room has a video in a queue, play the next video from the queue.
   * If queue is empty, then get a related video and play it.
   */
  currentVideoEnded(message) {
    var data = JSON.parse(message);
    var socketRedisCtrl = new SocketRedisController(this._redisClients, data['roomHash'],
                                                     data['roomKey'], data['videoKey']);
    var socketVideoQueueCtrl = new SocketVideoQueueController(this._redisClients['videoQueue'],
                                                               data['videoKey']);
    if (data['videoEnded']) {
      co(function* () {
        let videoData = yield socketRedisCtrl.getVideoData();

        if (videoData !== null) {
          let lastQueuedVideo = yield socketVideoQueueCtrl.pop();

          if (lastQueuedVideo === null) {
          // Queue is empty, so we get a related video from the last played video.
            let maxRelatedVideos = 50;

            if (!videoData['searchingRelatedVideo']) {
             // Now we should search for a related video.
              videoData['searchingRelatedVideo'] = true;
              // Set the last played videoId into related videos, so we won't play it again.
              videoData['relatedVideos']['videos'][data['videoId']] = 1;
              socketRedisCtrl.setVideoData(videoData);

              this.logger.log('queue is empty, searching for a related video for the room: '
                              + data['roomHash']);

              YouTubeAPIController.getRelatedVideos(data['videoId'], maxRelatedVideos)
                                  .then((body) => {
                let items = JSON.parse(body)['items'];
                if (typeof items !== 'undefined' && items != null && items.length > 0) {
                  // Avoid duplicated related videos.
                  // Max length of items is 50..so it's okay for this tiny blocking code.
                  let nextVideo = {username: 'vChat'};
                  for (let i = 0; i < items.length; i++) {
                    let videoId = items[i]['id']['videoId'];
                    if (!videoData['relatedVideos']['videos'].hasOwnProperty(videoId)) {
                      nextVideo['videoId'] = videoId;
                      videoData['relatedVideos']['videos'][videoId] = 1;
                      let length = parseInt(videoData['relatedVideos']['length']);
                      videoData['relatedVideos']['length'] = length + 1;
                      break;
                    }
                  }

                  // Reset related videos if over limit.
                  if (videoData['relatedVideos']['length'] >= maxRelatedVideos) {
                    this.logger.log('reached maximum related videos for the room: '
                      + data['roomHash'] + ' | resetting related videos');
                    videoData['relatedVideos'] = {length: 0, videos: {}};
                  }

                  // Just play the first related video if search results were all played before.
                  if (!nextVideo.hasOwnProperty('videoId')) {
                    nextVideo['videoId'] = items[0]['id']['videoId'];
                  }

                  videoData['currentVideo'] = nextVideo;
                  videoData['searchingRelatedVideo'] = false;
                  socketRedisCtrl.setVideoData(videoData);

                  // Notify users to play the related video.
                  let controlVideo = {
                    action: 'playRelatedVideo',
                    messageType: 'info',
                    nextVideo: nextVideo,
                    notificationType: Constants.NOTIFICATION_PLAY_RELATED_VIDEO
                  };
                  this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
                  this.logger.log('automatically playing a related video '
                    + 'for the room: ' + data['roomHash']);
                } else {
                  this.logger.error('error when searching for a related video for room:'
                    + data['roomHash'] + ' | videoId: ' + data['videoId']);

                  let controlVideo = {
                    action: 'noRelatedVideo',
                    messageType: 'warning'
                  };
                  this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
                }
              }).catch(() => {
                // TODO: handle situation when exceeded youtube api request limit
              });
            }
          } else {
          // There is/are video(s) in the queue, so play the next video.
            videoData['currentVideo'] = lastQueuedVideo;

            // Set to redis ASAP.
            videoData['searchingRelatedVideo'] = false;
            socketRedisCtrl.setVideoData(videoData);

            // Notify users to play next video.
            let controlVideo = {
              action: 'playNextFromQueue',
              messageType: 'info',
              nextVideo: lastQueuedVideo,
              notificationType: Constants.NOTIFICATION_PLAY_QUEUED_VIDEO
            };
            this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
            this.logger.log('automatically playing the next video from'
                            + ' the queue for the room: ' + data['roomHash']);
          }
        }
      }.bind(this));
    }
  }
}

exports.RoombeatController = RoombeatController;

