"use strict";

var router = require('express').Router();
var UserVideoList = require('../models/user_video_list').UserVideoList;
var UserVideoListController = require('../controllers/user_video_list').UserVideoListController;

router.get('/', (req, res) => {
  if (!req.session.loggedIn) {
    res.status(401);
    res.send();
  }

  var uvl = new UserVideoList();
  var userId = req.session.user['id'];
  uvl.getVideoList(userId).then((data) => res.send(data));
});

router.post('/', (req, res) => {
  if (!req.session.loggedIn) {
    res.status(401);
    res.send();
  }

  var uvlCtrl = new UserVideoListController();
  var params = req.body;
  params['user_id'] = req.session.user['id'];
  uvlCtrl.addVideoToList(params).then(() => res.send())
                                .catch((reason) => {
                                  res.status(400);
                                  res.send({reason: reason});
                                });
});

module.exports = router;
