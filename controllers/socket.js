"use strict";

var Controller = require('./controller').Controller;
var Constants = require('../app_modules/constants');
var SocketRedisController = require('../controllers/socket_redis').SocketRedisController;
var SocketSessionController = require('../controllers/socket_session').SocketSessionController;
var YouTubeAPIController = require('./youtube_api').YouTubeAPIController;


class SocketController extends Controller {
  /**
   * SocketController for vchat-socket server.
   * Never throw errors in this controller because we don't want to restart socket server.
   * Find a way to handle errors.
   *
   * NOTE: This controller is socket & room specific, and binded with SicketRedisController.
   */

  constructor(io, redisClients, socket) {
    super();
    let sessionKey = 'sess:' + socket['handshake']['sessionID'];
    this._socketSessionCtrl = new SocketSessionController(io, redisClients['session'],
                                                           sessionKey, socket['id']);
    this._io = io;
    this._roomHash = this._getRoomHash(socket);
    this._serverName = 'SERVER1'; // Hardcoded for now.
    this._roomKey = this._generateRoomKey();
    this._videoKey = this._generateVideoKey();
    this._socketRedisCtrl = new SocketRedisController(redisClients, this._roomHash,
                                                       this._roomKey, this._videoKey);
    this._user = {socketId: socket['id']};
    this._socket = socket;
    this._socket.join(this._roomKey);
    this._init();
  }

  _generateRoomKey() {
    return Constants.redisRoomKeyPrefix + ':' + this._serverName + ':' + this._roomHash;
  }

  _generateVideoKey() {
    return Constants.redisVideoKeyPrefix + ':' + this._serverName + ':' + this._roomHash;
  }

  /**
   * Generate user name, and save it to Redis.
   */
  _init() {
    this.logger.log('initiating new user ' + this._socket['id'] + ' | room: ' + this._roomHash);
    this._socketSessionCtrl.get('user').then((userData) => {
      if (userData !== null) {
        Object.assign(this._user, userData);
      } else {
        this._user['nickname'] = this._socket['id'];
      }
      this._socket.emit('username-update', {username: this._user['nickname']});
      this._broadcastToRoom('system-message', {
        message: '[' + this._user['nickname'] + '] entered the vChat room.',
        messageType: 'info'
      });
    });
    this._socketRedisCtrl.addUserToRoom(this._user).then(() => {
      this._socketSessionCtrl.init();
    });
  }

  /**
   * Check if there is a video currently playing, and if there is,
   * then get the play time from one of the sockets in room.
   */
  getCurrentPlayTimeForNewUser() {
    var sockets = this._io['sockets']['adapter']['rooms'][this._roomKey];
    var pingedClient = false;

    for (let key in sockets) {
      if (sockets[key] === true && key != this._socket['id']) {
      // Just sending one emit is fine enough.
        try {
          // It's possible that this user(socket) left the room,
          // right after we got the socket id.
          let data = {socketId: this._socket['id']};
          this._io['sockets']['connected'][key].emit('get-current-play-time-for-new-user', data);
          pingedClient = true;
          break;
        } catch (err) {
          // Continue looping..
        }
      }
    }

    this._socketRedisCtrl.getVideoData().then((data) => {
      if (!pingedClient) {
        if (typeof data !== 'undefined' && data !== null) {
        // This is a reactivated room, so new user is the first user.
          let newVideo = {
            videoId: data['currentVideo']['videoId'],
            message: 'You have reactivated the room.',
            messageType: 'info'
          };
          this._socket.emit('new-video-to-play', newVideo);
        } else {
        // This is a new room.
          let message = {
            message: 'Start vChat by searching for videos or copy and paste video links.',
            messageType: 'info'
          };
          this._socket.emit('system-message', message);
        }
        this._socket.emit('ready-for-roombeat');
      } else {
      // User entered an active room.
        let message = {
          message: 'You will be synced with the video.',
          messageType: 'info'
        };
        this._socket.emit('system-message', message);
        if (typeof data === 'undefined' || data === null) {
          this._socket.emit('ready-for-roombeat');
        }
      }
    });
  }

  playCurrentVideoForNewUser(data) {
    this.logger.log('play current video for new user socket: ' + data['socketId']
                    + ' | for room: ' + this._roomHash);

    data['currentVideoForNewUser'] = true;
    if (data['isEnded']) {
    // Roombeat is fired at every 3 seconds, so having a delay of 3 seconds is reasonable.
      this._delayProcessCurrentVideoForNewUser(data, 3);
    } else {
      this._processCurrentVideoForNewUser(data);
    }
  }

  /**
   * If current video is ended, server is playing the next video from the queue
   * or getting a related video, so we give a short delay here.
   */
  _delayProcessCurrentVideoForNewUser(data, delay, retry) {
    if (typeof retry !== 'undefined' && retry >= 5) {
      this.logger.log('retried 5 times to get next video for new user'
                      + ' | terminating the loop for socket: ' + data['socketId']);
      this._socket.emit('system-message', {
        message: 'Failed to sync with current video.',
        messageType: 'warning'
      });
      return;
    }

    this.logger.log('getting next video from the queue or searching for a related video'
                    + ' | delaying process for socket: ' + data['socketId']
                    + ' | for room: ' + this._roomHash);
    data['startAt'] = parseInt(data['startAt']) + delay;
    var timeoutId = setTimeout(() => {
      this._processCurrentVideoForNewUser(data, timeoutId, retry);
    }, 1000 * delay);
  }

  _processCurrentVideoForNewUser(data, timeoutId, retry) {
    if (typeof timeoutId !== 'undefined') clearTimeout(timeoutId);
    if (typeof retry === 'undefined') retry = 0;
    this._socketRedisCtrl.getVideoData().then((videoData) => {
      if (videoData['searchingRelatedVideo']) {
        this._delayProcessCurrentVideoForNewUser(data, 1, retry+1);
      } else {
        if (videoData['currentVideo']['videoId'] != data['currentVideoId']) {
          data['startAt'] = videoData['startAt'];
          data['videoId'] = videoData['currentVideo']['videoId'];
        } else {
          data['videoId'] = data['currentVideoId'];
        }
        delete data['currentVideoId'];
        this._playCurrentVideoForNewUser(data);
      }
    });
  }

  /**
   * Send message to client.
   */
  _playCurrentVideoForNewUser(data) {
    try {
      // Make sure new user is still connected.
      this._io['sockets']['connected'][data['socketId']].emit('new-video-to-play', data);
      this._io['sockets']['connected'][data['socketId']].emit('ready-for-roombeat');
    } catch (err) {
      // New user left the room so don't do anything..
    }
  }

  /**
   * New user is a pop out view user. Notify to users in room.
   */
  notifyPopOutUser() {
    this._broadcastToRoom('system-message', {
      message: '[' + this._user['nickname'] + '] is a Video Pop Out user. '
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
      message: '[' + this._user['nickname'] + '] has left the vChat room.',
      messageType: 'warning'
    });
    this.logger.log('user left the room: ' + this._roomHash
                     + ' | user: ' + this._user['socketId'])
    this._socketRedisCtrl.removeUserFromRoom(this._user);
  }
  /**
   * Parse room hash from socket object.
   */
  _getRoomHash(socket) {
    var referer = socket['handshake']['headers']['referer'];

    if (!referer.startsWith(Constants.appUrl)) {
      this.logger.log('invalid socket handshake from: ' + referer);
      return null;
    }

    referer = referer.split('/');
    // Remove query params.
    return referer[referer.length - 1].replace(/\?.*/, '');
  }


  /***** Chat & video  handlers *****/
  /**
   * Broadcast chat message to all in the room.
   */
  chatFromClient(data) {
    data['notificationType'] = Constants.NOTIFICATION_MESSAGE;
    this._broadcastInRoom('new-message', data);
  }

  /**
   * Validate youtube video, and add it to queue.
   */
  newVideoSubmit(data) {
    if (typeof data['videoId'] !== 'undefined') {
      // Video is submitted via search or video list.
    } else {
    // Check YouTube link.
      if (!data['link'].startsWith('https://www.youtube.com/watch?')
        && !data['link'].startsWith('https://youtu.be/')) {
        this.logger.log('Invalid video link: ' + data['link']);
        return;
      }

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

    this._socketRedisCtrl.queueVideo(data).then((playVideo) => {
      // Notify users that video is queued.
      data['message'] = 'queued new video!';
      data['messageType'] = 'info';
      data['notificationType'] = Constants.NOTIFICATION_NEW_VIDEO_QUEUED;
      this._broadcastInRoom('new-video-queued', data);

      if (playVideo) {
      // Client should play the queued video.
        this._socketRedisCtrl.getNextVideo().then((nextVideo) => {
          nextVideo['message'] = 'Playing a video from the queue.';
          nextVideo['messageType'] = 'info';
          nextVideo['notificationType'] = Constants.NOTIFICATION_PLAY_QUEUED_VIDEO;
          this._broadcastInRoom('new-video-to-play', nextVideo);
        });
      }
    }).catch(() => {
      this._socket.emit('system-message', {
        message: 'Cannot queue same videos in a row.',
        messageType: 'warning'
      });
    });
  }

  /**
   * Parse link and get id / start at.
   */
  _parseLink(link) {
    var time, id;
    var data = {id: null, startAt: null};
    for (let i = 0; i < link.length; i++) {
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
    data['notificationType'] = 'info';
    if (data['action'] == 'playNext') {
      this._socketRedisCtrl.getNextVideo().then((nextVideo) => {
        if (nextVideo !== null) {
          data['nextVideo'] = nextVideo;
          data['notificationType'] = Constants.NOTIFICATION_PLAY_NEXT_VIDEO;
          this._broadcastInRoom('control-video', data);
        } else {
          this._socket.emit('no-more-video', {
            message: 'No more videos in queue. Searching for a related video.',
            messageType: 'warning'
          });
          this._socketRedisCtrl.getVideoData().then((videoData) => {
            if (videoData['searchingRelatedVideo']) {
              this._socket.emit('new-message', {
                message: 'Currently searching for a related video.',
                messageType: 'info'
              });
            } else {
            // Search for a related video.
              let youtubeCtrl = new YouTubeAPIController();
              videoData['searchingRelatedVideo'] = true;
              // Set the last played videoId into related videos, so we won't play it again.
              videoData['relatedVideos']['videos'][videoData['currentVideo']['videoId']] = 1;
              this._socketRedisCtrl.setVideoData(videoData);

              this._socket.emit('new-message', {
                message: 'Queue is empty. Searching for a related video.',
                messageType: 'info'
              });
              this.logger.log('queue is empty, searching for a related video for the room: '
                              + this._roomHash);

              youtubeCtrl.getRelatedVideos(videoData, Constants.MAX_RELATED_VIDEOS, this._roomHash)
                         .then((updatedVideoData) => {
                // Short delay to avoid playNext request right after getting a related video.
                setTimeout(() => {
                  updatedVideoData['searchingRelatedVideo'] = false;
                  this._socketRedisCtrl.setVideoData(updatedVideoData);
                }, 1000);

                // Notify users to play the related video.
                data['action'] = 'playNextRelatedVideo';
                data['nextVideo'] = updatedVideoData['currentVideo'];
                data['notificationType'] = Constants.NOTIFICATION_PLAY_NEXT_VIDEO;
                this._broadcastInRoom('control-video', data);
                this.logger.log('Playing a related video due to empty queue when playNextVideo '
                                  + 'was requested for the room: ' + this._roomHash);
              }).catch(() => {
                this._socket.emit('new-message', {
                  message: 'Failed to get a related video.',
                  messageType: 'warning'
                });
              });
            }
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


