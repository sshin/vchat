"use strict";
var Model = require('./model').Model;


class Stickers extends Model {

  constructor() {
    super('stickers ', 'Stickers');
  }

  /**
   * Get all stickers for the user.
   */
  getStickers(userId) {
    var promise = new Promise((resolve, reject) => {
      this.runQuery('SELECT stickers FROM UserInfo WHERE user_id = ?', [userId], (userData) => {
        let stickerIds = userData[0]['stickers'].split(',');
        let where = 'WHERE id = ' + stickerIds.join(' OR id = ');

        this.runQuery('SELECT name, extension, display_name, num FROM Stickers ' + where, [], (stickers) => {
            resolve(stickers);
        });
      });
    });
    return promise;
  }

}

exports.Stickers = Stickers;
