"use strict";

var router = require('express').Router();
var YouTubeAPIController = require('../controllers/youtube_api').YouTubeAPIController;
var TaskQueue = require('../app_modules/taskqueue').TaskQueue;

router.get('/', (req, res) => {
  var youtubeCtrl = new YouTubeAPIController();
  youtubeCtrl.searchVideos(req.query).then((data) => {
    res.send(data);
    TaskQueue.addVideos(JSON.parse(data));
  }).catch(() => {
    // TODO: handle situation when exceeded youtube api request limit
  });
});

module.exports = router;
