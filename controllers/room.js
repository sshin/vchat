"use strict";

var Controller = require('./controller').Controller;
var Room = require('../models/room').Room;
var bcrypt = require('bcryptjs');


class RoomController extends Controller {

  constructor() {
    super();
    this._room = new Room();
  }

  searchPrivateRoom(params) {
    var promise = new Promise((resolve, reject) => {
      this.logger.log('searching private room: ' + params['name']);
      let hash = String.prototype.trim.apply(params['name']).replace(/ /g, '-');
      hash = hash.toLowerCase();
      if (hash.length === 0) {
        reject({status: 400});
      } else {
        this._room.select({
          select: ['password'],
          where: {
            hash: hash,
            private: 1
          }
        }).then((data) => {
          if (data.length === 0) {
            resolve(null);
          } else {
            bcrypt.compare(params['password'], data[0]['password'], (err, matched) => {
              if (!matched) {
                reject({status: 401});
              } else {
                resolve(hash);
              }
            });
          }
        });
      }
    });
    return promise;
  }

  searchPublicRoom(params) {
    var promise = new Promise((resolve, reject) => {
      let name = String.prototype.trim.apply(params['name']);
      this.logger.log('searching public room: ' + name);
      if (name.length === 0) {
        reject({status: 400});
      } else {
        this._room.select({
          select: ['hash'],
          where: {
            private: 0,
            name: name
          }
        }).then((data) => {
          if (data.length === 0) {
            resolve(null);
          } else {
            resolve(data[0]['hash']);
          }
        });
      }
    });
    return promise;
  }

  createNewRoom(params) {
    var promise = new Promise((resolve, reject) => {
      params['name'] = String.prototype.trim.apply(params['name']);
      let errors = this._validateCreateRoomInputs(params);
      if (errors.length > 0) {
        reject({status: 400, data: errors});
      } else {
        params['hash'] = params['name'].replace(/ /g, '-');
        params['hash'] = params['hash'].toLowerCase();
        this._room.checkRoomExist(params['hash']).then((exist) => {
          if (exist) {
            reject({status: 400, data: ['name exist']});
          } else {
            params['category_id'] = params['category'];
            params['private'] = params['roomType'] == 'public' ? 0 : 1;
            delete params['verifyPassword'];
            delete params['category'];
            delete params['roomType'];
            delete params['type'];

            if (params['password'] !== '') {
              // TODO: Move bcrypt part to dedicated service.
              bcrypt.hash(params['password'], 10, (err, hashedPassword) => {
                params['password'] = hashedPassword;
                this._room.insert(params).then(() => {
                  this.logger.log('Private room created: ' + params['hash']);
                  resolve(params);
                });
              });
            } else {
              this._room.insert(params).then(() => {
                this.logger.log('Public room created: ' + params['hash']);
                resolve(params);
              });
            }
          }
        });
      }
    });
    return promise;
  }

  _validateCreateRoomInputs(params) {
    var errors = [];

    if (params['category'] == 'none') errors.push('category');
    if (params['name'] == '') errors.push('name');
    if (params['type'] == '') errors.push('type');

    // If type is public, password can be empty.
    // If type is private, password is required.
    if ((params['roomType'] == 'private' && params['password'].length === 0) ||
        (params['password'] != params['verifyPassword'])) {
      errors.push('password');
    }

    return errors;
  }

  getActiveRoomCounts() {
    var promise = new Promise((resolve, reject) => {
      this._room.getActiveRoomCounts().then(resolve);
    });
    return promise;
  }
}

exports.RoomController = RoomController;

