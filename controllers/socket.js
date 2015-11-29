"use strict";

var Controller = require('./controller').Controller;
var Constants = require('../app_modules/constants');
var SocketRedisController = require('../controllers/socket_redis').SocketRedisController;


class SocketController extends Controller {
  /**
   * SocketController for vchat-socket server.
   * Never throw errros in this controller because we don't want to restart socket server.
   * Find a way to handle errors.
   *
   * NOTE: This controller is socket & room specific, and binded with SicketRedisController.
   */

  constructor(io, redisClient, redisClient2, socket) {
    super();
    this._io = io;
    this._roomHash = this._getRoomHash(socket);
    this._roomKey = Constants.redisRoomKeyPrefix + this._roomHash;
    this._redisCtrl = new SocketRedisController(redisClient, redisClient2, this._roomHash);
    this._user = {id: socket['id']};
    this._socket = socket;
    this._socket.join(this._roomKey);
    this._init();
  }

  /**
   * Generate user name, and save it to Redis.
   */
  _init() {
    this._redisCtrl.getRoom((data) => {
      this.logger.log('initiating new user ' + this._socket['id'] + ' | room: ' + this._roomHash);
      this._user['name'] = this._socket['id'];
      this._socket.emit('username-update', {username: this._user['name']});
      this._redisCtrl.addUserToRoom(this._user);
      this._broadcastToRoom('system-message', {
        messageType: 'info',
        message: '[' + this._user['name'] + '] entered the vChat room.'
      });
    });
  }

  /**
   * Check if there is a video currently playing, and if there is,
   * then get the play time from one of the sockets in room.
   */
  getCurrentPlayTimeForNewUser(data) {
    this._redisCtrl.checkVideoPlaying((videoId) => {
      if (videoId) {
        let sockets = this._io.sockets['adapter']['rooms'][this._roomKey];
        for (var key in sockets) {
          // Just sending one emit is fine enough...
          if (sockets[key] === true) {
            let data = {
              videoId: videoId,
              socketId: this._socket.id
            };
            try {
              // It's possible that this user(socket) left the room,
              // right after we got the socket id.
              this._io.sockets['connected'][key].emit('get-current-play-time-for-new-user', data);
              break;
            } catch (err) {
              // Continue looping..
            }
          }
        }
      }
    });
  }

  playCurrentVideoForNewUser(data) {
    data['currentVideo'] = true;
    var socketId = data['socketId'];
    delete data['socketId'];
    try {
      // Make sure new user is still connected.
      this._io.sockets['connected'][socketId].emit('new-video-to-play', data);
    } catch (err) {
      // New user left the room so don't do anything..
    }
  }

  /**
   * New user is a pop out view user. Notify to users in room.
   */
  notifyPopOutUser() {
    this._broadcastToRoom('system-message', {
      message: '[' + this._user['name'] + '] is a Video Pop Out user. '
               + 'This user cannot see chat messages.',
      messageType: 'warning'
    });
  }

  /**
   * User is leaving the chat room.
   * Romove from room and update all associated data.
   */
  leave() {
    this._broadcastToRoom('system-message', {
      message: '[' + this._user['name'] + '] has left the vChat room.',
      messageType: 'warning'
    });
    this._redisCtrl.removeUserFromRoom(this._user);
  }
  /**
   * Parse room hash from socket object.
   */
  _getRoomHash(socket) {
    var referer = socket['handshake']['headers']['referer'];
    referer = referer.split('/');
    return referer[referer.length - 1];
  }


  /***** Chat & video  handlers *****/
  /**
   * Broadcast chat message to all in the room.
   */
  chatFromClient(data) {
    this._broadcastInRoom('new-message', data);
  }

  /**
   * Validate youtube video, and add it to queue.
   */
  newVideoSubmit(data) {
    var submitType = '';
    if (typeof data['videoId'] !== 'undefined') {
      submitType = 'search';
    } else {
      submitType = 'link';
      // Check YouTube link.
      if (!data['link'].startsWith('https://www.youtube.com/watch?')
        && !data['link'].startsWith('https://youtu.be/')) {
        this.logger.log('Invalid video link: ' + data['link']);
        return;
      }
      
      this.logger.log('new video submit via link: ' + data['link']);
      if (data['link'].startsWith('https://youtu.be/')) {
        // This link is provided by Share menu.
        let link = data['link'].split('/');
        link = link[link.length - 1];
        let id = link;

        if (link.indexOf('?') >= 0) {
          // This link contains additional parameters.
          link = link.split('?');
          id = link[0];

          // Now lets see if this link contains start time.
          link = link[1].split('&');
          let startAt = this._getStartAt(link);
          if (startAt !== null) data['startAt'] = startAt;
        }
        data['videoId'] = id;
      } else {
        // Handle https://youtube.com/watch?. (v=id)
        let link = data['link'].split('/');
        link = link[link.length - 1].replace('watch?', '');
        link = link.split('&');
        let id = null;

        if (link.length > 1) {
          // Parse link.
          let parsedData = this._parseLink(link);
          if (parsedData['id'] !== null) id = parsedData['id'];
          if (parsedData['startAt'] !== null) data['startAt'] = parsedData['startAt'];
        } else {
          if (link[0].startsWith('v=')) id = link[0].replace('v=', '');
        }
        data['videoId'] = id;
      }
      if (data['videoId'] === null) {
        this.logger.log('Invalid video link: ' + data['link']);
        return;
      }
      delete data['link'];
    }

    this.logger.log('queuing a video | submit type: ' + submitType
                    + ' | videoId: ' + data['videoId'] + ' | room: ' + this._roomHash);
    // TODO: And probably verify given link is a real youtube video?
    this._redisCtrl.queueVideo(data, () => {
      // Callback for when queueing is done.
      data['message'] = 'queued new video!';
      data['messageType'] = 'info';
      this._broadcastInRoom('new-video-queued', data)
    }, (nextVideo) => {
      // This will be executed if there is no video currently playing.
      nextVideo['message'] = 'Playing a video from the queue.';
      nextVideo['messageType'] = 'info';
      this._broadcastInRoom('new-video-to-play', nextVideo);
    });
  }

  /**
   * Parse link and get id / start at.
   */
  _parseLink(link) {
    var time, id;
    var data = {id: null, startAt: null};
    for (var i = 0; i < link.length; i++) {
      if (link[i].startsWith('v=')) {
        id = link[i].replace('v=', '');
      } else if (link[i].startsWith('t=')) {
        time = link[i].replace('t=', '');
      }
    }

    if (typeof time !== 'undefined') {
      let startAt = time.split('m');
      if (startAt.length > 1) {
        // Format of t=1m33s..
        let min = startAt[0];
        let sec = startAt[1].replace('s', '');
        data['startAt'] = {
          min: min,
          sec: sec
        };
      } else {
        data['startAt'] = parseInt(startAt[0]);
      }
    }

    if (typeof id !== 'undefined') {
      data['id'] = id;
    }

    return data;
  }

  /**
   * Broadcast video control action in room.
   */
  controlVideo(data) {
    data['messageType'] = 'action';
    if (data['action'] == 'playNext') {
      this._redisCtrl.playNextVideo((nextVideo) => {
        if (nextVideo !== null) {
          data['nextVideo'] = nextVideo;
          this._broadcastInRoom('control-video', data);
        } else {
          this._socket.emit('no-more-video', {
            messageType: 'warning'
          });
        }
      });
    } else {
      this._broadcastInRoom('control-video', data);
    }
  }

  /**
   * Broadcast to all in room.
   */
  _broadcastInRoom(eventName, data) {
    this._io.sockets.in(this._roomKey).emit(eventName, data);
  }

  /**
   * Broadcast to all except the message sender in room.
   */
  _broadcastToRoom(eventName, data) {
    this._socket.broadcast.to(this._roomKey).emit(eventName, data);
  }
}

exports.SocketController = SocketController;


