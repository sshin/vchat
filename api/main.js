"use strict";

var router = require('express').Router();
var sendFileParam = {root: './'};

router.get('/', (req, res) => {
  res.sendFile('frontend/html/main.html', sendFileParam)
});

module.exports = router;

