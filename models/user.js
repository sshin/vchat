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
        resolve(rows.length > 0);
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
        resolve(rows.length > 0);
      });
    });
    return promise;
  }
}

exports.User = User;

