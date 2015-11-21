var Model = require('./model').Model;
var Constants = require('../app_modules/constants');
var Redis = require('./redis').Redis;
var co = require('co');

class Room extends Model {

  constructor() {
    super('room', 'Room');
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
    var promise = new Promise((resolve, reject) => {
      this.select({
        select: ['id'],
        where: {
          hash: hash
        }
      }).then((rows) => {
        resolve(rows.length > 0);
      });
    });
    return promise;
  }

  getActiveRoomCounts() {
    var promise = new Promise((resolve, reject) => {
      co(function* () {
        let publicRooms = yield this.redisRoomGet(Constants.publicRoomsCount);
        let privateRooms = yield this.redisRoomGet(Constants.privateRoomsCount);
        return {public: publicRooms, private: privateRooms};
      }.bind(this)).then(resolve);
    });
    return promise;
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
