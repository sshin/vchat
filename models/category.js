"use strict";
var Model = require('./model').Model;


class Category extends Model {

  constructor() {
    super('category', 'Category');
  }

  /**
   * Get all categories sorted by id.
   */
  getCategories() {
    var promise = new Promise((resolve, reject) => {
      this.select({
        select: ['id AS type', 'name'],
        order: {column: 'id', direction: 'ASC'}
      }).then(resolve);
    });
    return promise;
  }

}

exports.Category = Category;
