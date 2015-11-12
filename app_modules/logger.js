class Logger {

  log(message) {
    console.log('[Log] ' + message);
  }

  error(message) {
    console.log('[[Error]] ' + message);
  }

  dbLog(message, params) {
    if (Array.isArray(params)) {
      console.log('[DB Log] ' + message + ' | params: ' + params);
    } else {
      console.log('[DB Log] ' + message + ' | params----------------');
      console.log(params);
      console.log('-------------------------------------------------');
    }
  }

  dbError(message) {
    console.log('[[DB Error]] ' + message);
  }

  redisError(message) {
    console.log('[[Redis Error]] ' + message);
  }
}

module.exports = Logger;
