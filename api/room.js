var express = require('express');
var async = require('async');
var router = express.Router();
var Room = require('../models/room').Room;
var bcrypt = require('bcryptjs');
var Constants = require('../app_modules/constants');


router.get('/', (req, res) => {
    var func = req.query.get;
    var room = new Room();

    switch(func) {
        case 'mostLikedRooms':
            room.getMostLikedRooms((rooms) => {
                res.send({rooms: rooms})
            });
            break;
        case 'randomRooms':
            room.getRandomPublicRooms((rooms) => {
                res.send({rooms: rooms})
            });
        default:
            res.send('okay');
            break;
    }
});


/*
 * Create new chat room or search for rooms.
 */
router.post('/', (req, res) => {
    var params = req.body;
    var room = new Room();

    switch(params['type']) {
        case 'searchPrivateRoom':
            params['hash'] = params['name'].replace(/ /g, '-');
            params['hash'] = params['hash'].toLowerCase();
            room.select({
                select: ['password'],
                where: {
                    hash: params['hash']
                }
            }, (data) => {
                if (data.length === 0) {
                    res.status(400);
                    res.send({reason: 'no room'});
                } else {
                    bcrypt.compare(params['password'], data[0]['password'], (err, matched) => {
                        if (!matched) {
                            res.status(401);
                            res.send({reason: 'wrong password'});
                        } else {
                            if (typeof req.session.privateRooms === 'undefined') {
                                req.session.privateRooms = {};
                            }
                            req.session.privateRooms[params['hash']] = true;
                            res.send({url: '' + Constants.appUrl + 'vChat/private/' + params['hash']});
                        }
                    });
                }
            });
            break;
        case 'create':
            var errors = [];

            params['name'] = String.prototype.trim.call(params['name']);
            if (params['category'] == 'none') errors.push('category');
            if (params['name'] == '') errors.push('name');
            if (params['type'] == '') errors.push('type');

            // If type is public, password can be empty.
            // If type is private, password is required.
            if (params['type'] == 'private' && params['password'] == '' ||
                params['password'] != params['verifyPassword']) {
                errors.push('password');
            }

            if (errors.length > 0) {
                res.status(400);
                res.send({errors: errors});
                return;
            }

            params['hash'] = params['name'].replace(/ /g, '-');
            params['hash'] = params['hash'].toLowerCase();

            var room = new Room();

            async.waterfall([
                (callback) => {
                    room.checkRoomExist(params['hash'], (exist) => {
                        if (exist) {
                            callback(true);
                        } else {
                            callback(null);
                        }
                    });
                }
            ], (err) => {
                if (err) {
                    res.status(400);
                    res.send({reason: 'name exist'});
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
                                res.send({url: Constants.appUrl + 'vChat/' + params['hash']});
                            });
                        });
                    } else {
                        room.insert(params, () => {
                            res.send({url: Constants.appUrl + 'vChat/' + params['hash']});
                        });
                    }
                }
            });
            break;
    }
});

module.exports = router;

