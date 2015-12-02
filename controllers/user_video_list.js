"use strict";

var Controller = require('./controller').Controller;
var UserVideoList = require('../models/user_video_list').UserVideoList;


class UserVideoListController extends Controller {

  constructor() {
    super();
    this._uvl = new UserVideoList();
  }

  addVideoToList(params) {
    var promise = new Promise((resolve, reject) => {
      if (!this._isValidInputs(params)) reject();

      this._uvl.checkVideoInList(params).then((exist) => {
        if (exist) {
          reject('exist');
        } else {
          this._uvl.checkCanAdd(params).then((listIsFull) => {
            if (listIsFull) {
              reject('full');
            } else {
              this._uvl.addVideoToList(params).then(resolve);
            }
          });
        }
      });
    });
    return promise;
  }

  _isValidInputs(params) {
    if (typeof params['video_id'] === 'undefined' || params['video_id'] === '') return false;
    if (typeof params['title'] === 'undefined' || params['title'] === '') return false;
    if (typeof params['author'] === 'undefined' || params['author'] === '') return false;
    if (typeof params['user_id'] === 'undefined' || params['user_id'] === '') return false;
    return true;
  }
}

exports.UserVideoListController = UserVideoListController;
