"use strict";

var router = require('express').Router();
var UserController = require('../controllers/user').UserController;

router.post('/', (req, res) => {
  var userCtrl = new UserController();
  var params = req.body;
  userCtrl.validateSignUp(params).then((result) => {
    if (result['type'] === 'valid') {
      userCtrl.createUser(params).then(() => res.send('okay'));
    } else {
      res.status(400);
      res.send({errors: result['errors'], type: result['errorType']});
    }
  });
});

module.exports = router;
