var express = require('express');
var async = require('async');
var router = express.Router();
var Room = require('../models/room').Room;


router.get('/', function(req, res) {
    var func = req.query.get;
    var room = new Room();

    switch(func) {
        case 'mostlikedrooms':
            room.getMostLikedRooms(function(rooms) {
                res.send({state: 200, response: rooms});
            });
            break;
        case 'randomrooms':
            room.getRandomPublicRooms(function(rooms) {
                res.send({state: 200, response: rooms});
            });
        default:
            res.send({state: 200, response: 'okay'});
            break;
    }
});


/*
 * Create new chat room.
 */
router.post('/', function(req, res) {
    var params = req.body;
    var errors = [];

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
        res.send({state: 400, response: errors});
        return;
    }

    params['hash'] = params['name'].replace(/ /g, '-');
    params['hash'] = params['hash'].toLowerCase();

    var room = new Room();

    async.waterfall([
        function(callback) {
            room.checkRoomExist(params['hash'], function(exist) {
                if (exist) {
                    callback(true);
                } else {
                    callback(null);
                }
            });
        }
    ], function(err) {
        if (err) {
           res.send({state: 400, response: 'name exist'});
        } else {
            params['category_id'] = params['category'];
            params['private'] = params['type'] == 'public' ? 0 : 1;
            delete params['verifyPassword'];
            delete params['category'];
            delete params['type'];

            // TODO: hash password using bcrypt later.
           
            room.insert(params, function() {
               res.send({state: 200, response: 'okay'});
            });
        }
    });
});

module.exports = router;

