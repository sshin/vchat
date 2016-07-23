"use strict";

var Model = require('./model').Model;
var Constants = require('../app_modules/constants');


class RelatedVideo extends Model {

  constructor() {
    super('relatedVideo', 'RelatedVideo');
  }

  static saveRelatedVideo(currentVideoId, nextVideoId, score) {
    if (currentVideoId === null || nextVideoId === null) {
      this.logger.log('failed to saveRelatedVideo | currentVideoId: ' + currentVideoId
                      + ' | relatedVideoId:' + nextVideoId);
      return;
    }

    if (typeof score === 'undefined') score = Constants.RELATED_VIDEO_MIN_SCORE;

    var data = {
      related_video_id: currentVideoId,
      video_id: nextVideoId,
      score: score
    };

    var relatedVideo = new RelatedVideo();
    relatedVideo.saveVideo(data);
  }

  /**
   * Save videos to database. Data is normalized data where keys match db column names.
   */
  saveVideo(data) {
    var promise = new Promise((resolve, reject) => {
      this.logger.log('saving related video to database | currentVideoId: ' + data['related_video_id']
                      + ' | relatedVideoId:' + data['video_id']);
      this.insert(data).then(resolve);
    });
    return promise;
  }

  updateScores() {
    var promise = new Promise((resolve, reject) => {
      var sql =
          'UPDATE RelatedVideo AS rv ' +
          'JOIN (' +
          'SELECT MAX(id) AS row_id, related_video_id, video_id, SUM(score) AS calculated_score ' +
          'FROM RelatedVideo ' +
          'GROUP BY related_video_id, video_id ' +
          'HAVING calculated_score > 1' +
          ') AS t ON rv.id = t.row_id ' +
          'SET rv.score = t.calculated_score';
      this.runQuery(sql, [], () => resolve());
    });
    return promise;
  }

  deleteDuplicates() {
    var promise = new Promise((resolve, reject) => {
      var sql =
          'DELETE RelatedVideo FROM RelatedVideo ' +
          'JOIN (' +
          'SELECT video_id, related_video_id, MAX(score) AS val, COUNT(video_id) AS appears ' +
          'FROM RelatedVideo ' +
          'GROUP BY related_video_id, video_id ' +
          'HAVING appears > 1' +
          ') AS t ON (RelatedVideo.related_video_id = t.related_video_id AND RelatedVideo.video_id = t.video_id) ' +
          'WHERE RelatedVideo.score < val';
      this.runQuery(sql, [], () => resolve());
    });
    return promise
  }

}

exports.RelatedVideo = RelatedVideo;
