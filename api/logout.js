"use strict";

var router = require('express').Router();

router.post('/', (req, res) => {
  req.session['loggedIn'] = false;
  req.session['user'] = null;
  res.send();
});

module.exports = router;
