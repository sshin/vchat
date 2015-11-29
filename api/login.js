"use strict";

var router = require('express').Router();
var UserController = require('../controllers/user').UserController;

router.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.send({username: req.session.user['username'],
              email: req.session.user['email']});
  } else {
    res.status(401);
    res.send();
  }
});

router.post('/', (req, res) => {
  var userCtrl = new UserController();
  var params = req.body;
  userCtrl.login(params).then((result) => {
    if (result['authenticated']) {
      req.session.loggedIn = true;
      req.session.user = result['userData'];
      res.send({
        username: result['userData']['username'],
        email: result['userData']['email'],
        nickname: result['userData']['nickname']
      });
    } else {
      res.status(401);
      res.send();
    }
  });
});

module.exports = router;
