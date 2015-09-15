var express = require('express');
var router = express.Router();
var sendFileParam = {root: './'};
var Constants = require('../app_modules/constants');

router.get('/:room', (req, res) => {
    res.sendFile('frontend/html/vchat.html', sendFileParam)
});

router.get('/private/:room', (req, res) => {
    var room = req.params.room;
    if (typeof req.session.privateRooms === 'undefined' ||
        !req.session.privateRooms.hasOwnProperty(room)) {
        // Kick out user back to main page.
        res.redirect(Constants.appUrl);
    } else {
        res.sendFile('frontend/html/vchat.html', sendFileParam)
    }
});

module.exports = router;


