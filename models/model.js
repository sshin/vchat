var DBLogger = require('../app_modules/logger').DBLogger;
var DBPools = require('./db_pool');


class Model {
  /* Base model class */

  /*
   * These two arguements are required.
   */
  constructor(subclassModel, table) {
    if (typeof subclassModel === 'undefined' || typeof table === 'undefined') {
      throw new Error('subclass model name and table name is required.');
    }

    this._dbPool = DBPools.pool;
    this._redis = DBPools.redisClient;
    this._logger = new DBLogger();
    this.model = subclassModel;
    this.table = table;
  }

  /*
   * Get a connection from pool.
   *
   * NOTE: If this method is called directly from api or controller,
   * don't forget to release the connection after done using it.
   *
   */
  getConnection(callback) {
    this._dbPool.getConnection((err, connection) => {
      if (err) {
        this._logger.error('Cannot get DB connection.');
        throw err;
      }

      callback(connection);
    });
  }

  /*
   * Get connection and executes query.
   * Releases connection by itself.
   *
   * NOTE: This method seems like we expect 3 arguments,
   * but we accept calling this method with two arguments (query, callback).
   */
  runQuery(query, params, callback) {
    // A bit hacky, but this makes a better usability.
    // No function overloading sucks :(.
    if (typeof callback === 'undefined') {
      callback = params;
      params = [];
    }

    this.getConnection((connection) => {
      connection.query(query, params, (err, rows) => {
        connection.release();

        if (err) {
          this._logger.error('Cannot excute query.');
          throw err;
        }

        callback(rows);
      });
    });
  }

  /*
   * Build and execute SELECT query.
   * This method will only work for simple SELECT queries.
   *
   * NOTE: Only supports one JOIN.
   *       Only supports one ORDER BY.
   *       Use runQuery() for multiple conditions...
   *
   * Args:
   *      options: object
   *          select: array of column names.
   *          join: object {type, table, condition, select}.
   *          where: object {column: value} or nothing.
   *          like: object {column: value with %} or nothing.
   *          order: object {column, direction} or nothing.
   *          limit: number to limit result.
   *          offset: offset.
   */
  select(options, callback) {
    if (typeof options === 'undefined') {
      throw new Error('Missing options.');
    }

    var sql = 'SELECT ';
    var params = [];

    if (typeof options.select === 'undefined') {
      sql += '* ';
    } else {
      for (var i = 0; i < options.select.length; i++) {
        options.select[i] = this.table + '.' + options.select[i];
      }
      let select = options.select.join(', ');
      sql += select + ' ';
    }

    var join;
    if (typeof options.join !== 'undefined') {
      join = {};
      join['join'] = options.join['type'] + ' JOIN ' + options.join['table'];
      join['join'] += ' ON (' + options.join['condition'] + ') ';
      for (var i = 0; i < options.join.select.length; i++) {
        options.join.select[i] = options.join['table'] + '.' + options.join.select[i];
      }
      let select = options.join.select.join(', ');
      sql += ', ' + select + ' ';
    }

    sql += 'FROM ' + this.table + ' ';

    if (typeof join !== 'undefined') sql += join['join'];

    var where;
    if (typeof options.where !== 'undefined') {
      where = '';
      let count = 0;
      for (var key in options.where) {
        if (count >= 1) where += ' AND ';
        where += key + ' = ? ';
        params.push(options.where[key]);
        count++;
      }
    }

    if (typeof options.like !== 'undefined') {
      if (typeof where === 'undefined') {
        where = '';
      } else {
        where += ' AND ';
      }
      let count = 0;
      for (var key in options.like) {
        if (count >= 1) where += ' AND ';
        where += key + ' LIKE  ? ';
        params.push(options.like[key]);
        count++;
      }
    }

    if (typeof where !== 'undefined') sql += 'WHERE ' + where;

    if (typeof options.order !== 'undefined') {
      sql += ' ORDER BY ' + options.order['column'] + ' ' + options.order['direction'];
    }

    if (typeof options['limit'] !== 'undefined') {
      sql += ' LIMIT ' + options['limit'];
    }

    if (typeof options['offset'] !== 'undefined') {
      sql += ' OFFSET ' + options['offset'];
    }

    this.runQuery(sql, params, callback);
  }

  /*
   * Build and execute INSERT query.
   *
   * NOTE: params is required.
   */
  insert(params, callback) {
    if (typeof params === 'undefined') {
      throw new Error('Missing params.');
    }

    var sql = "INSERT INTO " + this.table + " SET ?";
    this.runQuery(sql, params, callback);
  }


}


exports.Model = Model;


