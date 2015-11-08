var Controller = require('./controller').Controller;
var User = require('../models/user').User;
var async = require('async');
var bcrypt = require('bcryptjs');

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
      var data = {
        type: 'error',
        errorType: 'invalid',
        errors: errors
      };
      callback(data);
      return;
    }

    var user = new User();
    async.waterfall([
      (asyncCallback) => {
        user.checkUsernameExist(params['username'], (usernameExist) => {
          if (usernameExist) {
            asyncCallback(null, 'username');
          } else {
            asyncCallback(null, '');
          }
        });
      },
      (error, asyncCallback) => {
        user.checkEmailExist(params['email'], (emailExist) => {
          if (emailExist) {
            asyncCallback(null, error + '/email');
          } else {
            asyncCallback(null, error)
          }
        });
      }
    ], (err, results) => {
      if (results.length > 0) {
        var data = {
          type: 'error',
          errorType: 'exist',
          errors: results.split('/')
        };
        callback(data);
      } else {
        callback({type: 'valid'});
      }
    });
  }
  
  createUser(params, callback) {
    var user = new User();
    bcrypt.hash(params['password'], 10, (err, hash) => {
      params['password'] = hash;
      delete params['passwordVerify'];
      user.insert(params, () => callback());
    });
  }

  login(params, callback) {
    var user = new User();
    user.select({
      select: ['id', 'username', 'email', 'password'],
      where: {
        username: params['username']
      }
    }, (rows) => {
      if (rows.length > 0) {
        let userData = rows[0];
        bcrypt.compare(params['password'], userData['password'], (err, matched) => {
          if (!matched) {
            callback(false, {});
          } else {
            delete userData['password'];
            callback(true, userData);
          }
        });
      } else {
        callback(false, {});
      }
    });
  }

}

exports.UserController = UserController;
