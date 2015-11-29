var CONFIG = {
  baseUrl: 'http://vchat.nullcannull-dev.net/',
  socketServer: 'http://vchat-socket.nullcannull-dev.net',
  roombeatServer: 'http://vchat-roombeat.nullcannull-dev.net'
};
CONFIG['vChatUrl'] = CONFIG['baseUrl'] + 'vChat/';
CONFIG['apiUrl'] = CONFIG['baseUrl'] + 'api/';
CONFIG['imageUrl'] = CONFIG['baseUrl'] + 'assets/images/';
CONFIG['popOutUrl'] = CONFIG['baseUrl'] + 'popout/';

/** APP Controller Class **/
function App() {
  this.escapeHTML = function (string) {
    // undersocre.js escape function
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


  /** request **/
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


  /** pop out **/
  this.popOutVideoOnly = function(type, room) {
    var url = this._getPopOutURL(type, room) + '?videoonly=1';
    this._popOut(url, 831, 500);
  };

  this.popOutRegular = function(type, room) {
    var url = this._getPopOutURL(type, room);
    this._popOut(url, 831, 785);
  };

  this.popOutWithControl = function(type, room) {
    var url = this._getPopOutURL(type, room) + '?testcontrol=1';
    this._popOut(url, 831, 880);
  };

  this._getPopOutURL = function(type, room) {
    return CONFIG['popOutUrl'] + type + '/' + room;
  };

  this._popOut = function(url, width, height) {
    var size = 'width=' + width + ',height=' + height;
    window.open(url, '', size);
  };


  /** user info **/
  this.user = {};
  this.get('login', {
    success: function(data) {
      this.user = data;
      this.showUserSettings();
    }.bind(this),
    error: function() {
      this.showLogin();
      this.log('user not logged in');
    }.bind(this)
  });

  this.showLogin = function() {
    $('#comp-sign-in').removeClass('hide');
    $('#comp-user-settings').addClass('hide');
  };

  this.showUserSettings = function() {
    $('#user-settings-welcome-nickname').text(this.user['nickname']);
    $('#comp-sign-in').addClass('hide');
    $('#comp-user-settings').removeClass('hide');
  };


  /** loggers **/
  this.log = function(message) {
    console.log('[Log] ' + message);
  };

  this.error = function(message) {
    console.error('[[Error]] ' + message);
  };
}

var app = new App();
