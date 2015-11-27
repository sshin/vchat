var router = require('express').Router();
var UserController = require('../controllers/user').UserController;

router.post('/', (req, res) => {
  req.session.loggedIn = false;
  req.session.user = {};
  res.send();
});

module.exports = router;
