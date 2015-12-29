"use strict";

var router = require('express').Router();
var UserController = require('../controllers/user').UserController;


router.get('/', (req, res) => {
  if (req.session['loggedIn']) {
    res.send(UserController.toJSON(req.session['user']));
  } else {
    res.status(401);
    res.send();
  }
});

router.post('/', (req, res) => {
  if (req.session['loggedIn']) {
    let userCtrl = new UserController();
    let keys = ['nickname', 'settings_allow_control', 'settings_allow_queue'];
    userCtrl.updateUserSettings(req.body, req.session['user']['id']).then((updatedUser) => {
        for (let i = 0; i < keys.length; i++) {
          if (updatedUser.hasOwnProperty(keys[i])) {
            req.session['user'][keys[i]] = updatedUser[keys[i]];
          }
        }
        res.send(UserController.toJSON(req.session['user']));
      }).catch((reason) => {
        res.status(400);
        res.send(reason);
      });
  } else {
    res.status(401);
    res.send();
  }
});

module.exports = router;
