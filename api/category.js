"use strict";

var router = require('express').Router();
var Category = require('../models/category').Category;

router.get('/', (req, res) => {
  var category = new Category();
  category.getCategories().then((categories) => {
    res.send({categories: categories})
  });
});

module.exports = router;
