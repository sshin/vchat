"use strict";

var router = require('express').Router();

router.get('/', (req, res) => {
  res.send('okay');
});

module.exports = router;
