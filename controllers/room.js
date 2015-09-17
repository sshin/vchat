var express = require('express');
var Logger = require('../app_modules/logger').Logger;
var Constants = require('../app_modules/constants');
var Room = require('../models/room').Room;
var bcrypt = require('bcryptjs');

class RoomController {

    searchPrivateRoom(params) {
        var hash = String.prototype.trim.apply(params['name']).replace(/ /g, '-');
        hash = hash.toLowerCase();
        var room = new Room();
        var promise =  new Promise((resolve, reject) => {
                room.select({
                    select: ['password'],
                    where: {
                        hash: hash,
                        private: 1
                    }
                }, (data) => {
                    if (data.length === 0) {
                        console.log('empty');
                        resolve();
                    } else {
                        bcrypt.compare(params['password'], data[0]['password'], (err, matched) => {
                            if (!matched) {
                                reject({status: 401});
                            } else {
                                resolve(hash);
                            }
                        });
                    }
                }
            );
        });
        return promise;
    }

    searchPublicRoom(params) {
        var name = String.prototype.trim.apply(params['name']);
        var room = new Room();
        var promise = new Promise((resolve, reject) => {
            room.runQuery('SELECT name, hash FROM Room WHERE name LIKE ? AND private = 0',
                ['%' + name + '%'], (data) => {
                    resolve(data);
                }
            );
        });
        return promise;
    }

    createNewRoom(params) {
        var room = new Room();
        params['hash'] = params['name'].replace(/ /g, '-');
        params['hash'] = params['hash'].toLowerCase();

        var promise = new Promise((resolve, reject) => { 
            room.checkRoomExist(params['hash'], (exist) => {
                if (exist) {
                    reject({status: 400, data: ['name exist']});
                } else {
                    params['category_id'] = params['category'];
                    params['private'] = params['type'] == 'public' ? 0 : 1;
                    delete params['verifyPassword'];
                    delete params['category'];
                    delete params['type'];

                    if (params['password'] !== '') {
                        bcrypt.hash(params['password'], 10, (err, hash) => {
                            params['password'] = hash;
                            room.insert(params, () => {
                                resolve(params['hash']);
                            });
                        });
                    } else {
                        room.insert(params, () => {
                            resolve(params['hash']);
                        });
                    }
                }
            });
        });
        return promise;
    }

}

exports.RoomController = RoomController;

