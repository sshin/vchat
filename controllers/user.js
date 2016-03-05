"use strict";

var Controller = require('./controller').Controller;
var User = require('../models/user').User;
var UserInfo = require('../models/user_info').UserInfo;
var bcrypt = require('bcryptjs');
var co = require('co');


class UserController extends Controller {

  constructor() {
    super();
    this._user = new User();
    this._userInfo = new UserInfo();
  }

  validateSignUp(params, callback) {
    var promise = new Promise((resolve, reject) => {
      let errors = this._validateSignUpInputs(params);

      if (errors.length > 0) {
        this.logger.log('Failed to create new user | invalid input(s)');
        let data = {
          type: 'error',
          errorType: 'invalid',
          errors: errors
        };
        resolve(data);
      } else {
        co(function* () {
        // Check if username or email or nickname already exist.
          let exists = [];
          let usernameExist = yield this._user.checkUsernameExist(params['username']);
          let emailExist = yield this._user.checkEmailExist(params['email']);
          let nicknameExist = yield this._user.checkNicknameExist(params['nickname']);

          if (usernameExist) exists.push('username');
          if (emailExist) exists.push('email');
          if (nicknameExist) exists.push('nickname');

          return exists;
        }.bind(this)).then((exists) => {
          let data = {};
          if (exists.length > 0) {
            this.logger.log('Failed to create new user | username(' + params['username']
              + ') or email(' + params['email'] + ') or nickname(' +params['nickname']
              + ') already exist');
            data = {
              type: 'error',
              errorType: 'exist',
              errors: exists
            };
          } else {
            this.logger.log('User will be created | username(' + params['username']
              + '), email(' + params['email'] + '), nickname(' + params['nickname'] + ')');
            data = {type: 'valid'};
          }
          resolve(data);
        });
      }
    });
    return promise;
  }

  _validateSignUpInputs(params) {
    var errors = [];
    // Check username.
    if (typeof params['username'] === 'undefined' || params['username'] === '') {
      errors.push('username');
    } else {
      if (/[^a-zA-Z0-9]/.test(params['username'])) {
        errors.push('username');
      }
    }

    // Check password.
    if (typeof params['password'] === 'undefined' || params['password'] === '' ||
        typeof params['passwordVerify'] === 'undefined' || params['passwordVerify'] === '' ||
        params['password'] != params['passwordVerify']) {
      errors.push('password');
    }

    // Check email.
    if (typeof params['email'] === 'undefined' || params['email'] === '') {
      errors.push('email');
    }

    // Check nickname.
    if (typeof params['nickname'] === 'undefined' || params['nickname'] === '') {
      errors.push('nickname');
    }

    return errors;
  }
  
  createUser(params) {
    var promise = new Promise((resolve, reject) => {
      bcrypt.hash(params['password'], 10, (err, hash) => {
        params['password'] = hash;
        delete params['passwordVerify'];
        this._user.insert(params).then(() => {
          this._user.getByUserName(params['username']).then((userData) => {
            this._userInfo.insert({user_id: userData['id']}).then(resolve);
          });
        });
      });
    });
    return promise;
  }

  login(params) {
    var promise = new Promise((resolve, reject) => {
      this._user.runQuery(
        'SELECT user.id, user.username, user.email, user.password, user.nickname, userInfo.allow_control, userInfo.allow_queue, userInfo.stickers ' +
        'FROM User as user ' +
        'LEFT JOIN UserInfo as userInfo ON (user.id = userInfo.user_id) ' +
        'WHERE username = ?', [params['username']], (rows) => {
        if (rows.length > 0) {
          let userData = rows[0];
          bcrypt.compare(params['password'], userData['password'], (err, matched) => {
            if (!matched) {
              this.logger.log('Login failure | wrong password | username: ' + params['username']);
              resolve({authenticated: false});
            } else {
              this.logger.log('Login success | username: ' + params['username']);
              delete userData['password'];
              resolve({authenticated: true, userData: userData});
            }
          });
        } else {
          this.logger.log('Login failure | username does not exist | ' + params['username']);
          resolve({authenticated: false});
        }
      });
    });
    return promise;
  }

  updateUserSettings(params, userId) {
    var promise = new Promise((resolve, reject) => {
      let updateParams = {
        where: {
          user_id: userId
        },
        set: {
          allow_control: params['allowControl'],
          allow_queue: params['allowQueue']
        }
      };
      this._userInfo.update(updateParams).then(() => {
        if (typeof params['nickname'] !== 'undefined' && params['nickname'].length > 0) {
          this._user.checkNicknameExist(params['nickname']).then((exist) => {
            if (exist) {
              reject(['nickname']);
              return;
            }
            let userUpdateParams = {
              where: {
                id: userId
              },
              set: {
                nickname: params['nickname']
              }
            };
            updateParams['set']['nickname'] = params['nickname'];
            this._user.update(userUpdateParams).then(() => resolve(updateParams['set']));
          });
        } else if (typeof params['nickname'] !== 'undefined' && params['nickname'].length === 0) {
          reject(['invalid']);
        } else {
          resolve(updateParams['set']);
        }
      });
    });
    return promise;
  }

  static toJSON(params) {
    return {
      username: params['username'],
      email: params['email'],
      nickname: params['nickname'],
      settings: {
        allowControl: params['allow_control'],
        allowQueue: params['allow_queue']
      },
      hasStickers: params['stickers'].length > 0
    };
  }
}

exports.UserController = UserController;
