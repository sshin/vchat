var Controller = require('./controller').Controller;
var request = require('request');
var credentials = require('credentials');

class RoombeatController extends Controller {

  constructor(redisClient, io) {
    super();
    this._redisClient = redisClient;
    this._io = io;
  }

  /**
   * Roombeat detected that current video ended for a room.
   * If this room has a video in a queue, play the next video from the queue.
   * If queue is empty, then get a related video and play it.
   */
  currentVideoEnded(message) {
    var data = JSON.parse(message);
    if (data['videoEnded']) {
      this._redisClient.get(data['videoKey'], (err, videoData) => {
        if (err) throw err;

        videoData = JSON.parse(videoData);
        if (videoData !== null) {
          if (videoData['queue'].length === 0) {
            let maxRelatedVideos = 20;
            // Queue is empty, so we get a related video from the last played video.
            // If roombeat controller is currently searching for a related video, don't do anything.
            if (videoData['searchingRelatedVideo']) return;

            // Now we should search for a related video.
            videoData['searchingRelatedVideo'] = true;
            // Set the last played videoId into related videos, so we won't play it again.
            videoData['relatedVideos']['videos'][data['videoId']] = 1;
            this._redisClient.set(data['videoKey'], JSON.stringify(videoData));

            this.logger.log('queue is empty, searching for a related video for the room: '
                             + data['roomHash']);

            // We store maximum 10 related videos to avoid duplicated related videos.
            request.get({
              url: 'https://www.googleapis.com/youtube/v3/search',
              qs: {
                part: 'snippet',
                relatedToVideoId: data['videoId'],
                type: 'video',
                maxResults: maxRelatedVideos,
                key: credentials.youtubeAPIKey
              },
              headers: {
                'Referer': credentials.APIReferer
              }
            }, (error, response, body) => {
              let items = JSON.parse(body)['items'];
              if (typeof items !== 'undefined' && items != null && items.length > 0) {
                // Avoid duplicated related videos.
                // Max length of items is 20..so it's okay for this tiny blocking code.
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
                                   + data['roomHash']);
                  videoData['relatedVideos'] = {length: 0, videos: {}};
                }

                // Just play the first related video if search results were all played before.
                if (!nextVideo.hasOwnProperty('videoId')) {
                  nextVideo['videoId'] = items[0]['id']['videoId'];
                }

                videoData['currentVideo'] = nextVideo;
                videoData['searchingRelatedVideo'] = false;
                // Set to redis ASAP.
                this._redisClient.set(data['videoKey'], JSON.stringify(videoData));

                // Notify users to play the related video.
                let controlVideo = {
                  action: 'playRelatedVideo',
                  messageType: 'info',
                  nextVideo: nextVideo
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
            });
          } else {
            // There is/are video(s) in the queue, so play the next video.
            let nextVideo = videoData['queue'].shift();
            videoData['currentVideo'] = nextVideo;

            // Set to redis ASAP.
            videoData['searchingRelatedVideo'] = false;
            this._redisClient.set(data['videoKey'], JSON.stringify(videoData));

            // Notify users to play next video.
            let controlVideo = {
              action: 'playNextFromQueue',
              messageType: 'info',
              nextVideo: nextVideo
            };
            this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
            this.logger.log('automatically playing the next video from'
                            + ' the queue for the room: ' + data['roomHash']);
          }
        }
      });
    }
  }
}

exports.RoombeatController = RoombeatController;

