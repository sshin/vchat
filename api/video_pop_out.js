"use strict";

var router = require('express').Router();
var Room = require('../models/room').Room;
var sendFileParam = {root: './'};

router.get('/public/:room', (req, res) => {
  var room = new Room();
  var hash = req.params.room;
  room.checkRoomExist(hash).then((roomExist) => {
    if (roomExist) {
      res.sendFile('frontend/html/video_pop_out.html', sendFileParam);
    } else {
      res.redirect(Constants.appUrl);
    }
  });
});

router.get('/private/:room', (req, res) => {
  var room = req.params.room;
  var roomModel = new Room();
  roomModel.checkRoomExist(room).then((roomExist) => {
    if (roomExist) {
      if (typeof req.session.privateRooms === 'undefined' ||
          !req.session.privateRooms.hasOwnProperty(room)) {
        res.redirect(Constants.appUrl);
      } else {
        res.sendFile('frontend/html/video_pop_out.html', sendFileParam);
      }
    } else {
      res.redirect(Constants.appUrl);
    }
  });
});

module.exports = router;
