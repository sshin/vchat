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
        this._redis.get('test-1', function(data) {
            callback([data]);
        });
    }

    /* 
     * Get random public live rooms. 
     */
    getRandomPublicRooms(callback) {
    }

    /*
    getMostLikedRooms(callback) {
         Get Top 5 most liked rooms.
        this.select({
            select: ['name', 'likes', 'hash'],
            join: {
                type: 'LEFT', 
                table: 'Category',
                condition: 'Room.category_id = Category.id',
                select: ['name']
            },
            where: {
                private: 0
            },
            order: {
                column: 'likes', 
                direction: 'DESC'
            },
            limit: 5
        }, function(rows) {
            callback(rows);
        });
    }
    */

    /* 
     * Check if room exist by hash lookup. 
     */
    checkRoomExist(hash, callback) {
        this.select({
            select: ['id'],
            where: {
                hash: hash
            }
        }, function(rows) {
            callback(rows.length > 0);
        });
    }

}


exports.Room = Room;



