var Model = require('./model').Model;


class User extends Model {

  constructor() {
    super('user', 'User');
  }

  checkUsernameExist(username, callback) {
    this.select({
      where: {
        username: username
      }
    }, (rows) => {
      callback(rows.length > 0);
    });
  }

  checkEmailExist(email, callback) {
    this.select({
      where: {
        email: email
      }
    }, (rows) => {
      callback(rows.length > 0);
    });
  }

}
exports.User = User;
