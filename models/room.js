var Model = require('./model').Model;
var Constants = require('../app_modules/constants');
var async = require('async');

class Room extends Model {

  constructor() {
    super('room', 'Room');
  }

  /**
   * Get today's most liked rooms from redis Sorted Set
   */
  getMostLikedRooms(callback) {
    // TODO: This is temporary....
    this._redis.get('test-1', (data) => {
      callback([data]);
    });
  }

  /**
   * Get random public live rooms.
   */
  getRandomPublicRooms(callback) {
  }

  /**
   * Check if room exist by hash lookup.
   */
  checkRoomExist(hash, callback) {
    this.select({
      select: ['id'],
      where: {
        hash: hash
      }
    }, (rows) => {
      callback(rows.length > 0);
    });
  }

  getActiveRoomCounts(callback) {
    async.waterfall([
      (next) => {
        this._redisRoomClient.get(Constants.publicRoomsCount, (err, count) => {
          next(null, count);
        });
      },
      (publicCount, next) => {
        this._redisRoomClient.get(Constants.privateRoomsCount, (err, count) => {
          next(null, {public: publicCount, private: count});
        });
      }
    ], (err, data) => {
      callback(data);
    });
  }

  /**
   * Deletes the room by hash.
   */
  deleteRoom(hash) {
    this.runQuery('DELETE FROM Room WHERE hash = ?', hash, null);
  }

  /**
   * Delete all rooms in room table.
   */
  clearRoom() {
    this.runQuery('DELETE FROM Room');
  }
}


exports.Room = Room;



