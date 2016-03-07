"use strict";

var router = require('express').Router();
var YouTubeAPIController = require('../controllers/youtube_api').YouTubeAPIController;

router.get('/', (req, res) => {
  var youtubeCtrl = new YouTubeAPIController();
  youtubeCtrl.searchVideos(req.query).then((data) => {
    res.send(data);
  }).catch(() => {
    // TODO: handle situation when exceeded youtube api request limit
  });
});

module.exports = router;
