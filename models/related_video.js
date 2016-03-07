"use strict";

var Model = require('./model').Model;


class RelatedVideo extends Model {

  constructor() {
    super('relatedVideo', 'RelatedVideo');
  }

  /**
   * Save videos to database. Data is normalized data where keys match db column names.
   */
  saveVideo(data) {
    var promise = new Promise((resolve, reject) => {
      this.logger.log('saving related video to database | videoId: ' + data['video_id']);
      this.insert(data).then(resolve);
    });
    return promise;
  }

  updateCounts() {
    var promise = new Promise((resolve, reject) => {
      var sql = 'UPDATE RelatedVideo AS rv ' +
                 'JOIN (' +
                 'SELECT MAX(id) AS row_id, related_video_id, video_id, SUM(count) AS calculated_count ' +
                 'FROM RelatedVideo ' +
                 'GROUP BY related_video_id, video_id ' +
                 'HAVING calculated_count > 1' +
                 ') AS t ON rv.id = t.row_id ' +
                 'SET rv.count = t.calculated_count';
      this.runQuery(sql, [], () => resolve());
    });
    return promise;
  }

  deleteDuplicates() {
    var promise = new Promise((resolve, reject) => {
      var sql = 'DELETE RelatedVideo FROM RelatedVideo ' +
        'JOIN (' +
        'SELECT video_id, related_video_id, MAX(count) AS val, COUNT(video_id) AS appears ' +
        'FROM RelatedVideo ' +
        'GROUP BY related_video_id, video_id ' +
        'HAVING appears > 1' +
        ') AS t ON (RelatedVideo.related_video_id = t.related_video_id AND RelatedVideo.video_id = t.video_id) ' +
        'WHERE RelatedVideo.count < val';
      this.runQuery(sql, [], () => resolve());
    });
    return promise
  }

}

exports.RelatedVideo = RelatedVideo;
