"use strict";

var router = require('express').Router();

router.get('/', (req, res) => {
  console.log('heartbeat');
  res.send('okay');
});

module.exports = router;
