var express = require('express');
var router = express.Router();
var model = require('../models/category');

router.get('/', (req, res) => {
    var category = new model.Category();
    category.getCategories((categories) => {
        res.send({categories: categories})
    });
});



module.exports = router;


