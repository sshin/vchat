var Model = require('./model').Model;
var Constants = require('../app_modules/constants');

class Room extends Model {

  constructor() {
    super('room', 'Room');
  }

  /*
   * Get today's most liked rooms from redis Sorted Set
   */
  getMostLikedRooms(callback) {
    // TODO: This is temporary....
    this._redis.get('test-1', (data) => {
      callback([data]);
    });
  }

  /*
   * Get random public live rooms.
   */
  getRandomPublicRooms(callback) {
  }

  /*
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

}


exports.Room = Room;



