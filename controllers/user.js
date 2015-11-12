var Controller = require('./controller').Controller;
var User = require('../models/user').User;
var async = require('async');
var bcrypt = require('bcryptjs');
var co = require('co');

class UserController extends Controller{

  constructor() {
    super();
  }

  validateSignUp(params, callback) {
    var errors = [];
    if (typeof params['username'] === 'undefined' || params['username'] === '') {
      errors.push('username');
    } else {
      if (/[^a-zA-Z0-9]/.test(params['username'])) {
        errors.push('username');
      }
    }
    if (typeof params['password'] === 'undefined' || params['password'] === '' ||
        typeof params['passwordVerify'] === 'undefined' || params['passwordVerify'] === '' ||
        params['password'] != params['passwordVerify']) {
      errors.push('password');
    }
    if (typeof params['email'] === 'undefined' || params['email'] === '') {
      errors.push('email');
    }

    if (errors.length > 0) {
      this.logger.log('Failed to create new user | invalid input(s)');
      var data = {
        type: 'error',
        errorType: 'invalid',
        errors: errors
      };
      callback(data);
      return;
    }

    var user = new User();
    co(function* () {
      var usernameExist = yield user.checkUsernameExist(params['username']);
      var emailExist = yield user.checkEmailExist(params['email']);
      var exists = [];
      if (usernameExist) exists.push('username');
      if (emailExist) exists.push('email');
      return exists;
    }).then((result) => {
      if (result.length > 0) {
        this.logger.log('Failed to create new user | username(' + params['username']
                        + ') or email(' + params['email'] + ') already exist');
        callback({
          type: 'error',
          errorType: 'exist',
          errors: result
        });
      } else {
        this.logger.log('User will be created | username(' + params['username']
                        + '), email(' + params['email'] + ')');
        callback({type: 'valid'});
      }
    });
  }
  
  createUser(params, callback) {
    var user = new User();
    bcrypt.hash(params['password'], 10, (err, hash) => {
      params['password'] = hash;
      delete params['passwordVerify'];
      user.insert(params).then(callback);
    });
  }

  login(params, callback) {
    var user = new User();
    user.select({
      select: ['id', 'username', 'email', 'password'],
      where: {
        username: params['username']
      }
    }).then((rows) => {
      if (rows.length > 0) {
        let userData = rows[0];
        bcrypt.compare(params['password'], userData['password'], (err, matched) => {
          if (!matched) {
            this.logger.log('Login failure | wrong password | username: ' + params['username']);
            callback(false, {});
          } else {
            this.logger.log('Login success | username: ' + params['username']);
            delete userData['password'];
            callback(true, userData);
          }
        });
      } else {
        this.logger.log('Login failure | username doet not exist | ' + params['username']);
        callback(false, {});
      }
    });
  }

}

exports.UserController = UserController;
