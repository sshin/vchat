"use strict";
var Model = require('./model').Model;


class Stickers extends Model {

  constructor() {
    super('stickers ', 'Stickers');
  }

  /**
   * Get all stickers for the user.
   */
  getStickers(stickerIds) {
    var promise = new Promise((resolve, reject) => {
      var where = 'WHERE id = ' + stickerIds.join(' OR id = ');

      this.runQuery('SELECT name, extension, display_name, num FROM Stickers ' + where, [], (stickers) => {
          resolve(stickers);
      });
    });
    return promise;
  }

}

exports.Stickers = Stickers;
