var router = require('express').Router();
var UserController = require('../controllers/user').UserController;

router.post('/', (req, res) => {
  var userCtrl = new UserController();
  var params = req.body;
  userCtrl.login(params, (authenticated, userData) => {
    if (authenticated) {
      req.session.loggedIn = true;
      req.session.user = userData;
      res.send();
    } else {
      res.status(401);
      res.send();
    }
  });
});

module.exports = router;
