var redisClient = require('./db_pool').redisClient;

class RedisAppModel {

  constructor() {
    this._redisClient = redisClient;
  }

  /**
   * Grabs redis client.
   *
   * NOTE: Use let instead of var where you call this method,
   * so we can immediately release it.
   */
  getRedisClient() {
    return this._redisClient;
  }

  /**
   * Get from Redis.
   */
  get(key, callback) {
    this._redisClient.get(key, (err, data) => {
      if (err) {
        this.logger.redisError('Error on get for key: ' + key);
        throw new Error('Redis Error');
      } else {
        callback(data);
      }
    });
  }

  /**
   * Execute zrevrange. (Get data from desnding order sorted set)
   */
  zrevrange(key, start, end, callback) {
    this._redisClient.zrevrange(key, start, end, (err, data) => {
      if (err) {
        this.logger.redisError('Error on zrevrange for key: ' + key);
        throw new Error('Redis Error');
      } else {
        callback(data);
      }
    });
  }

  /**
   * Execute zcard. (Get count of elements for key in Sorted Set)
   */
  zcard(key, callback) {
    this._redisClient.zcard(key, (err, data) => {
      if (err) {
        this.logger.redisError('Error on zcard for key: ' + key);
        throw new Error('Redis Error');
      } else {
        callback(data);
      }
    });
  }

}

exports.RedisAppModel = RedisAppModel;
