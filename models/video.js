"use strict";

var Model = require('./model').Model;


class Video extends Model {

  constructor() {
    super('video', 'Video');
  }

  getVideoById(videoId) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          video_id: videoId
        }
      }).then((video) => {
        if (video.length === 0) {
          reject();
          return;
        }

        resolve(video[0]);
      });
    });
    return promise;
  }

  /**
   * Save videos to database. Data is normalized data where keys match db column names.
   */
  saveVideo(data) {
    var promise = new Promise((resolve, reject) => {
      this.getVideoById(data['video_id']).then(() => {
        this.logger.log('video already in database | not saving');
        resolve();
      }).catch(() => {
        data['provider_id'] = 1; // hardcoded for now.
        this.logger.log('saving video to database | videoId: ' + data['video_id']);
        this.insert(data).then(resolve);
      });
    });
    return promise;
  }

}

exports.Video = Video;
