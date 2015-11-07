var Logger = require('../app_modules/logger').Logger;

class Controller {

  constructor() {
    this.logger = new Logger();
  }

}

exports.Controller = Controller;
