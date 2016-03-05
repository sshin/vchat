"use strict";

var router = require('express').Router();
var Stickers = require('../models/stickers').Stickers;

router.get('/', (req, res) => {
  if (!req.session['loggedIn']) {
    res.status(401);
    res.send();
    return;
  }

  var stickers = new Stickers();
  stickers.getStickers(req.session['user']['id']).then((data) => res.send(data));
});

module.exports = router;
