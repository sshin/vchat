"use strict";

var router = require('express').Router();
var RoomController = require('../controllers/room').RoomController;
var Constants = require('../app_modules/constants');

router.get('/', (req, res) => {
  var func = req.query.get;
  var roomCtrl = new RoomController();

  switch (func) {
    case 'randomRooms':
      roomCtrl.getRandomPublicRooms((rooms) => {
        res.send({rooms: rooms})
      });
      break;
    case 'counts':
      roomCtrl.getActiveRoomCounts().then((counts) => {
        if (counts['public'] === null) counts['public'] = 0;
        if (counts['private'] === null) counts['private'] = 0;
        if (counts['users'] === null) counts['users'] = 0;
        res.send(counts);
      });
      break;
    default:
      res.send('okay');
      break;
  }
});


/**
 * Create new chat room or search for rooms.
 */
router.post('/', (req, res) => {
  var params = req.body;
  var roomCtrl = new RoomController();

  switch (params['type']) {
    case 'searchPrivateRoom':
      roomCtrl.searchPrivateRoom(params).then((hash) => {
        if (typeof req.session.privateRooms === 'undefined') {
          req.session.privateRooms = {};
        }
        if (hash === null) {
          res.status(404);
          res.send();
        } else {
          req.session.privateRooms[hash] = true;
          res.send({
            room: Constants.appUrl + 'vChat/private/' + hash,
            popout: Constants.popoutUrl + 'private/' + hash
          });
        }
      }).catch((data) => res.status(data['status']).send());
      break;
    case 'searchPublicRoom':
      roomCtrl.searchPublicRoom(params).then((hash) => {
        if (hash === null) {
          res.status(404).send();
        } else {
          res.send({
            room: Constants.appUrl + 'vChat/public/' + hash,
            popout: Constants.popoutUrl + 'public/' + hash
          });
        }
      }).catch((data) => res.status(data['status']).send());
      break;
    case 'create':
      roomCtrl.createNewRoom(params).then((data) => {
        let hash = data['hash'];
        let path = 'vChat/';
        if (data['private'] === 1) {
          if (typeof req.session.privateRooms === 'undefined') {
            req.session.privateRooms = {};
          }
          req.session.privateRooms[hash] = true;
          path += 'private/';
        } else {
          path += 'public/';
        }
        res.send({url: Constants.appUrl + path + hash});
      }).catch((data) => {
        res.status(data['status']).send({errors: data['data']});
      });
      break;
  }
});

module.exports = router;
