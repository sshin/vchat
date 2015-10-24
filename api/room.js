var express = require('express');
var async = require('async');
var router = express.Router();
var RoomController = require('../controllers/room').RoomController;
var Constants = require('../app_modules/constants');


router.get('/', (req, res) => {
  var func = req.query.get;
  var room = new Room();

  switch (func) {
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
  var roomCtrl = new RoomController();

  switch (params['type']) {
    case 'searchPrivateRoom':
      var searchPrivateRoom = roomCtrl.searchPrivateRoom(params);
      searchPrivateRoom.then((hash) => {
        if (typeof req.session.privateRooms === 'undefined') {
          req.session.privateRooms = {};
        }
        if (hash === null) {
          res.status(404);
          res.send();
        } else {
          req.session.privateRooms[hash] = true;
          res.send({url: '' + Constants.appUrl + 'vChat/private/' + hash});
        }
      }).catch((data) => res.status(data['status']).send());
      break;
    case 'searchPublicRoom':
      var searchPublicRoom = roomCtrl.searchPublicRoom(params);
      searchPublicRoom.then((hash) => {
        if (hash === null) {
          res.status(404).send();
        } else {
          res.send({url: '' + Constants.appUrl + 'vChat/' + hash});
        }
      }).catch((data) => res.status(data['status']).send());
      break;
    case 'create':
      var errors = [];

      params['name'] = String.prototype.trim.apply(params['name']);
      if (params['category'] == 'none') errors.push('category');
      if (params['name'] == '') errors.push('name');
      if (params['type'] == '') errors.push('type');

      // If type is public, password can be empty.
      // If type is private, password is required.
      if ((params['roomType'] == 'private' && params['password'].length === 0) ||
          (params['password'] != params['verifyPassword'])) {
        errors.push('password');
      }

      if (errors.length > 0) {
        res.status(400);
        res.send({errors: errors});
        return;
      }

      // Now all inputs are valid, try inserting into database.
      var createNewRoom = roomCtrl.createNewRoom(params);
      createNewRoom.then((data) => {
        let hash = data['hash'];
        let path = 'vChat/';
        if (data['private'] === 1) {
          if (typeof req.session.privateRooms === 'undefined') {
            req.session.privateRooms = {};
          }
          req.session.privateRooms[hash] = true;
          path += 'private/';
        }
        res.send({url: Constants.appUrl + path + hash});
      }).catch((data) => {
        res.status(data['status']).send({errors: data['data']});
      });
      break;
  }
});

module.exports = router;

