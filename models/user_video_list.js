"use strict";

var Model = require('./model').Model;


class UserVideoList extends Model {

  constructor() {
    super('user_video_list', 'UserVideoList');
  }

  getVideoList(userId) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        select: ['video_id as videoId', 'author', 'title'],
        where: {
          user_id: userId
        },
        order: {
          column: 'id',
          direction: 'ASC'
        }
      }).then(resolve);
    });

    return promise;
  }

  checkVideoInList(params) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          user_id: params['user_id'],
          video_id: params['video_id']
        }
      }).then((rows) => {
        resolve(rows.length > 0);
      });
    });

    return promise;
  }

  /**
   * Returns:
   *  isListFull(boolean): whether user video list is full.
   */
  checkCanAdd(params) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          user_id: params['user_id']
        }
      }).then((rows) => {
        // User can memorize up to 50 videos.
        resolve(rows.length >= 50);
      });
    });

    return promise;
  }

  addVideoToList(params) {
    return this.insert(params);
  }

}

exports.UserVideoList = UserVideoList;
