var express = require('express');
var router = express.Router();
var model = require('../models/category');

router.get('/', function(req, res) {
    var category = new model.Category();
    category.getCategories(function(categories) {
        res.send({state: 200, response: categories});
    });
});



module.exports = router;


