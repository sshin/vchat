var express = require('express');
var router = express.Router();
var sendFileParam = {root: './'};

router.get('/', (req, res) => {
    res.sendFile('frontend/html/vchat.html', sendFileParam)
});

module.exports = router;


