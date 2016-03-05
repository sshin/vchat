"use strict";

var Model = require('./model').Model;


class User extends Model {

  constructor() {
    super('user', 'User');
  }

  checkUsernameExist(username) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          username: username
        }
      }).then((rows) => {
        resolve(rows.length > 0);
      });
    });
    return promise;
  }

  checkEmailExist(email) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          email: email
        }
      }).then((rows) => {
        resolve(rows.length > 0);
      });
    });
    return promise;
  }

  checkNicknameExist(nickname) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          nickname: nickname
        }
      }).then((rows) => {
        resolve(rows.length > 0);
      });
    });
    return promise;
  }

  getByUserName(username) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          username: username
        }
      }).then((rows) => {
        if (rows.length > 0) {
          resolve(rows[0]);
        } else {
          reject();
        }
      });
    });
    return promise;
  }
}

exports.User = User;

