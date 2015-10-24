var CONFIG = {
  baseUrl: 'http://vchat.nullcannull-dev.net/',
  chatServer: 'http://vhat-socket.nullcannull-dev.net'
};
CONFIG['apiUrl'] = CONFIG.baseUrl + 'api/';
CONFIG['imageUrl'] = CONFIG.baseUrl + 'assets/images/';

/* APP Controller Class */
function App() {
  this.escapeHTML = function (string) {
    /* undersocre.js escape function  */
    var entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;',
      '/': '&#x2F;'
    };

    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  };

  this._ajax = function (type, func, options) {

    var params = {
      url: CONFIG.apiUrl + func,
      type: type
    };

    if (options['data']) params['data'] = options['data'];
    if (options['before']) params['beforeSend'] = options['before'];
    if (options['success']) params['success'] = options['success'];
    params['error'] = function (xhr) {
      if (options['error']) {
        var data = {status: xhr.status};
        if (xhr.responseText !== '') {
          data['response'] = $.parseJSON(xhr.responseText);
        }
        options['error'](data);
      }
    }.bind(this);

    $.ajax(params);
  };

  this.get = function (func, options) {
    this._ajax('GET', func, options);
  };

  this.post = function (func, options) {
    this._ajax('POST', func, options);
  };

  this.put = function (func, options) {
    this._ajax('PUT', func, options);
  };

  this.remove = function (func, options) {
    this._ajax('DELETE', func, options);
  };

  this.redirect = function (url) {
    if (typeof url === 'undefined') {
      windows.location.href = CONFIG.baseUrl;
    } else {
      windows.location.href = CONFIG.baseUrl + url;
    }
  };

  /** loggers **/
  this.log = function(message) {
    console.log('Log: ' + message);
  };

  this.error = function(message) {
    console.error('Error: ' + message);
  };
}

var app = new App();


