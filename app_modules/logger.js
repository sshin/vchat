"use strict";


class Logger {

  _getTime() {
    return new Date().toLocaleString();
  }

  log(message) {
    console.log('%s:[Log] %s', this._getTime(), message);
  }

  logJSON(key, json) {
    console.log('%s:[Log:%s] %j', this._getTime(), key, json);
  }

  error(message) {
    console.log('%s:[[Error]] %s', this._getTime(), message);
  }

  dbLog(message, params) {
   console.log('%s:[DB Log] %s | params: %j', this._getTime(), message, params);
  }

  dbError(message) {
    console.log('%s:[[DB Error]] %s', this._getTime(), message);
  }

  redisError(message) {
    console.log('%s:[[Redis Error]] %s', this._getTime(), message);
  }
}

module.exports = Logger;
