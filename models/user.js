var Model = require('./model').Model;


class User extends Model {

  constructor() {
    super('user', 'User');
  }

  checkUsernameExist(username) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          username: username
        }
      }, (rows) => {
        if (rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    return promise;
  }

  checkEmailExist(email, callback) {
    var promise = new Promise((resolve, reject) => {
      this.select({
        where: {
          email: email
        }
      }, (rows) => {
        if (rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    return promise;
  }
}

exports.User = User;

