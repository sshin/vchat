"use strict";

var Model = require('./model').Model;


class UserInfo extends Model {

  constructor() {
    super('userInfo', 'UserInfo');
  }
}

exports.UserInfo = UserInfo;

