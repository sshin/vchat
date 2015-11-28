var Controller = require('./controller').Controller;
var request = require('request');
var apiKey = require('credentials').youtubeAPIKey;

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
    let data = JSON.parse(message);
    if (data['videoEnded']) {
      this._redisClient.get(data['videoKey'], (err, videoData) => {
        if (err) throw err;

        videoData = JSON.parse(videoData);
        if (videoData !== null) {
          if (videoData['queue'].length === 0) {
            // Queue is empty, so we get a related video from the last played video.
            // If roombeat controller is currently searching for a related video, don't do anything.
            if (videoData['searchingRelatedVideo']) return;

            // Now we should search for a related video.
            videoData['searchingRelatedVideo'] = true;
            // Set the last played videoId into related videos, so we won't play it again.
            videoData['relatedVideos']['videos'][data['videoId']] = 1;
            this._redisClient.set(data['videoKey'], JSON.stringify(videoData));

            this.logger.log('Queue is empty. Searching for a related video for the room: '
                             + data['roomHash']);

            // We store maximum 10 related videos to avoid duplicated related videos.
            let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=';
            url += data['videoId'] + '&type=video&maxResults=20&key=' + apiKey;
            request.get({
              url: url,
              headers: {
                'Referer': 'vchat.nullcannull-dev.net'
              }
            }, (error, response, body) => {
              let items = JSON.parse(body)['items'];
              if (typeof items !== 'undefined' && items != null && items.length > 0) {
                this.logger.log('Found a related video for the room: ' + data['roomHash']);

                // Avoid duplicated related videos.
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

                // Reset related videos if over 20.
                if (videoData['relatedVideos']['length'] >= 20) {
                  this.logger.log('reached maximum related videos for the room: '
                                   + data['roomHash']);
                  videoData['relatedVideos'] = {length: 0, videos: {}};
                  // Just play the first related video if search result were all played before.
                  if (!nextVideo.hasOwnProperty('videoId')) {
                    nextVideo['videoId'] = items[0]['id']['videoId'];
                  }
                }

                // Found a related video. Set it to current video.
                videoData['currentVideo'] = nextVideo;

                // Set to redis ASAP.
                videoData['searchingRelatedVideo'] = false;
                this._redisClient.set(data['videoKey'], JSON.stringify(videoData));

                // Notify users to play the related video.
                let controlVideo = {
                  action: 'playRelatedVideo',
                  nextVideo: nextVideo
                };
                this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
                this.logger.log('Automatically playing the related video '
                                + 'for the room: ' + data['roomHash']);
              } else {
                this.logger.error('Error when searching for a related video for room:'
                                   + data['roomHash'] + ' | videoId: ' + data['videoId']);

                let controlVideo = {action: 'noRelatedVideo'};
                this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
                // videoData.searchingRelatedVideo should be true if it hits this else block,
                // but we want to keep it as true, because we don't want to do any more search
                // that will return an error for sure.
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
              nextVideo: nextVideo
            };
            this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
            this.logger.log('Automatically playing the next video from'
                + ' the queue for the room: ' + data['roomHash']);
          }
        }
      });
    }
  }
}

exports.RoombeatController = RoombeatController;

