"use strict";

var fs = require('fs');

module.exports = (app) => {
  /** libs **/
  app.get('/libs/:file', (req, res) => {
    var path = 'libs/' + req.params.file;
    _serveStaticFile(res, path);
  });

  /** assets **/
  app.get('/assets/:type/:file', (req, res) => {
    var path = 'assets/' + req.params.type + '/' + req.params.file;
    _serveStaticFile(res, path);
  });

  /** stickers **/
  app.get('/assets/stickers/:name/:file', (req, res) => {
    var path = 'assets/stickers/' + req.params.name + '/' + req.params.file;
    _serveStaticFile(res, path);
  });

  /** frontend **/
  app.get('/frontend/:type/:file', (req, res) => {
    var path = 'frontend/' + req.params.type + '/' + req.params.file;
    _serveStaticFile(res, path);
  });
  app.get('/frontend/js/components/:file', (req, res) => {
    var path = 'frontend/js/components/' + req.params.file;
    _serveStaticFile(res, path);
  });
  app.get('/frontend/js/components/:type/:file', (req, res) => {
    var path = 'frontend/js/components/' + req.params.type + '/' + req.params.file;
    _serveStaticFile(res, path);
  });


  /** static pages **/
  app.use('/', require('./api/main'));
  app.use('/vChat', require('./api/vchat'));
  app.use('/popout', require('./api/video_pop_out'));
  app.use('/heartbeat', require('./api/heartbeat'));

  /** api routing **/
  // TODO: Singup/Login should be handled in it's own service.
  app.use('/api/signup', require('./api/signup'));
  app.use('/api/login', require('./api/login'));
  app.use('/api/logout', require('./api/logout'));
  app.use('/api/room', require('./api/room'));
  app.use('/api/category', require('./api/category'));
  app.use('/api/videosearch', require('./api/video_search'));
  app.use('/api/uservideolist', require('./api/user_video_list'));
  app.use('/api/usersettings', require('./api/user_settings'));
  app.use('/api/userstickers', require('./api/user_stickers'));
};

/**
 * Check if file exist, and respond to client.
 */
function _serveStaticFile(res, path) {
  fs.exists(path, (exists) => {
    if (exists) {
      res.sendFile(path, {root: './'});
    } else {
      res.send('File not found');
    }
  });
}
