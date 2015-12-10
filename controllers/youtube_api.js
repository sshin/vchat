"use strict";

var Controller = require('./controller').Controller;
var request = require('request');
var credentials = require('credentials');


class YouTubeAPIController extends Controller {

  /**
   * Search related videos via YouTube data API.
   *
   * Returns
   *  resolve: related videos.
   *  reject: if api request limit is exceed.
   */
  static getRelatedVideos(videoId, maxRelatedVideos) {
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
        resolve(body);
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
  static searchVideos(query) {
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
        resolve(body);
      });
    });
    return promise;
  }

}

exports.YouTubeAPIController = YouTubeAPIController;
