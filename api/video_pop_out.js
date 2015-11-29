"use strict";

var router = require('express').Router();
var Room = require('../models/room').Room;
var sendFileParam = {root: './'};

router.get('/public/:room', (req, res) => {
  var room = new Room();
  var hash = req.params.room;
  var html = 'frontend/html/video_pop_out.html';

  if (req.query.hasOwnProperty('videoonly') && req.query.hasOwnProperty('videoonly')) {
    html = 'frontend/html/video_only_pop_out.html';
  } else if (req.query.hasOwnProperty('testcontrol') && req.query.hasOwnProperty('testcontrol')) {
    html = 'frontend/html/video_with_control_pop_out.html';
  }

  room.checkRoomExist(hash).then((roomExist) => {
    if (roomExist) {
      res.sendFile(html, sendFileParam);
    } else {
      res.send('Invalid');
    }
  });
});

router.get('/private/:room', (req, res) => {
  var room = req.params.room;
  var roomModel = new Room();
  var html = 'frontend/html/video_pop_out.html';

  if (req.query.hasOwnProperty('videoonly') && req.query.hasOwnProperty('videoonly')) {
    html = 'frontend/html/video_only_pop_out.html';
  } else if (req.query.hasOwnProperty('testcontrol') && req.query.hasOwnProperty('testcontrol')) {
    html = 'frontend/html/video_with_control_pop_out.html';
  }

  roomModel.checkRoomExist(room).then((roomExist) => {
    if (roomExist) {
      if (typeof req.session.privateRooms === 'undefined' ||
          !req.session.privateRooms.hasOwnProperty(room)) {
        res.send('Invalid');
      } else {
        res.sendFile(html, sendFileParam);
      }
    } else {
      res.send('Invalid');
    }
  });
});

module.exports = router;
