var Model = require('./model').Model;


class Category extends Model {

  constructor() {
    super('category', 'Category');
  }

  /**
   * Get all categories sorted by id.
   */
  getCategories(callback) {
    this.select({
      select: ['id AS type', 'name'],
      order: {column: 'id', direction: 'ASC'}
    }).then(callback);
  }

}

exports.Category = Category;
