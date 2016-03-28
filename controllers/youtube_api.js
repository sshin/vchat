"use strict";

var Controller = require('./controller').Controller;
var request = require('request');
var credentials = require('credentials');
var Constants = require('../app_modules/constants');
var TaskQueue = require('../app_modules/taskqueue').TaskQueue;


class YouTubeAPIController extends Controller {

  /**
   * Search related videos via YouTube data API.
   *
   * Returns
   *  resolve: related videos.
   *  reject: if api request limit is exceed.
   */
  getRelatedVideos(videoData, maxRelatedVideos, roomHash) {
    var promise = new Promise((resolve, reject) => {
      let videoId = videoData['currentVideo']['videoId'];
      this._getRelatedVideosFromYoutube(videoId, maxRelatedVideos).then((body) => {
        let items = JSON.parse(body)['items'];
        if (typeof items !== 'undefined' && items != null && items.length > 0) {
          // Avoid duplicated related videos.
          let nextVideo = {username: 'vChat', isRelatedVideo: true};
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
          if (videoData['relatedVideos']['length'] >= Constants.MAX_RELATED_VIDEOS) {
            this.logger.log('reached maximum related videos for the room: '
                             + roomHash + ' | resetting related videos');
            videoData['relatedVideos'] = {length: 0, videos: {}};
          }

          // Just play the first related video if search results were all played before.
          if (!nextVideo.hasOwnProperty('videoId')) {
            nextVideo['videoId'] = items[0]['id']['videoId'];
          }

          videoData['currentVideo'] = nextVideo;
          resolve(videoData);
          TaskQueue.addVideos(items, videoId);
        }
      }).catch(reject);
    });
    return promise;
  }

  _getRelatedVideosFromYoutube(videoId, maxRelatedVideos) {
    var promise = new Promise((resolve, reject) => {
      request.get({
        url: 'https://www.googleapis.com/youtube/v3/search',
        qs: {
          part: 'snippet',
          relatedToVideoId: videoId,
          type: 'video',
          maxResults: maxRelatedVideos,
          key: credentials.youtubeAPIKey
        },
        headers: {
          'Referer': credentials.APIReferer
        }
      }, (error, response, body) => {
        if (body.hasOwnProperty('error')) {
          reject();
        } else {
          resolve(body);
        }
      });
    });
    return promise;
  }

  /**
   * Search videos via YouTube data API.
   *
   * Returns
   *  resolve: related videos.
   *  reject: if api request limit is exceed.
   */
  searchVideos(query) {
    var promise = new Promise((resolve, reject) => {
      var data = {
        url: 'https://www.googleapis.com/youtube/v3/search',
        qs: {
          key: credentials.youtubeAPIKey,
          part: 'snippet',
          q: query['q'],
          type: 'video',
          maxResults: 20
        },
        headers: {
          'Referer': credentials.APIReferer
        }
      };

      if (typeof query['pageToken'] !== 'undefined') data['qs']['pageToken'] = query['pageToken'];

      request.get(data, (error, response, body) => {
        if (body.hasOwnProperty('error')) {
          reject();
        } else {
          resolve(body);
          TaskQueue.addVideos(JSON.parse(body));
        }
      });
    });
    return promise;
  }

}

exports.YouTubeAPIController = YouTubeAPIController;
