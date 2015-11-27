var Controller = require('./controller').Controller;
var User = require('../models/user').User;
var bcrypt = require('bcryptjs');
var co = require('co');

class UserController extends Controller {

  constructor() {
    super();
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
          let user = new User();
          let usernameExist = yield user.checkUsernameExist(params['username']);
          let emailExist = yield user.checkEmailExist(params['email']);
          let nicknameExist = yield user.checkNicknameExist(params['nickname']);

          if (usernameExist) exists.push('username');
          if (emailExist) exists.push('email');
          if (nicknameExist) exists.push('nickname');

          return exists;
        }).then((exists) => {
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
  
  createUser(params, callback) {
    var user = new User();
    bcrypt.hash(params['password'], 10, (err, hash) => {
      params['password'] = hash;
      delete params['passwordVerify'];
      user.insert(params).then(callback);
    });
  }

  login(params) {
    var promise = new Promise((resolve, reject) => {
      let user = new User();
      user.select({
        select: ['id', 'username', 'email', 'password', 'nickname'],
        where: {
          username: params['username']
        }
      }).then((rows) => {
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

}

exports.UserController = UserController;
