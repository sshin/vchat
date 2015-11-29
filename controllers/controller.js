"use strict";

var Logger = require('../app_modules/logger');


class Controller {

  constructor() {
    this.logger = new Logger();
  }

}

exports.Controller = Controller;
