var express = require('express');
var Logger = require('../app_modules/logger').Logger;
var SocketRedisController = require('../controllers/socket_redis').SocketRedisController;


class SocketController {
    /*
     * SocketController for vchat-socket server.
     * Never throw errros in this controller because we don't want to restart socket server.
     * Find a way to handle errors.
     */

    constructor(io, redisClient, redisClient2, redisClient3, socket) {
        this._io = io;
        this._roomHash = this._getRoomHash(socket);
        this._redisCtrl = new SocketRedisController(redisClient, redisClient2, 
                redisClient3, this._roomHash);
        this._user = {id: socket.id};
        this._socket = socket;
        this._socket.join(this._roomHash);
        this._logger = new Logger();
        this._systemMessageClass = {
            info: 'system-message-info',
            warning: 'system-message-warning',
            action: 'system-message-action'
        };
        this._init();
    }

    /* 
     * Generate user name, and save it to Redis.
     */
    _init() {
        // TODO: Change the logic for generating user name.
        this._redisCtrl.getRoom(this._roomHash, (data) => {
            this._user['name'] = 'vChat User ' + this._socket['id'];
            this._socket.emit('username-update', {username: this._user['name']});
            this._redisCtrl.addUserToRoom(this._roomHash, this._user);
            this._broadcastToRoom('new-user-entered', {
                username: this._user['name'],
                chatClass: this._systemMessageClass['info'],
                message: 'entered the vChat room.'
            });
        });
    }

    getCurrentPlayTimeForNewUser(data) {
        this._redisCtrl.checkVideoPlaying((videoId) => {
            if (videoId) {
                let sockets = this._io.sockets.adapter.rooms[this._roomHash];
                for (var key in sockets) {
                    // Just sending one emit is fine enough...
                    if (sockets[key] === true) {
                        let data = {
                            videoId: videoId,
                            socketId: this._socket.id
                        }
                        try {
                            // It's possible that this user(socket) left the room,
                            // right after we got the socket id.
                            this._io.sockets.connected[key].emit('get-current-play-time-for-new-user', data);
                            break;
                        } catch(err) {
                            // Continue looping..
                        }
                    }
                }
            }
        });
    }

    playCurrentVideoForNewUser(data) {
        data['currentVideo'] = true;
        data['startAt'] = parseInt(data['startAt']) + 1;
        let socketId = data['socketId'];
        delete data['socketId'];
        try {
            // Make sure new user is still connected.
            this._io.sockets.connected[socketId].emit('new-video-to-play', data);
        } catch(err) {
            // Welp.
        }
    }

    /*
     * User is leaving the chat room.
     * Romove from room and update all associated data.
     */
    leave() {
        this._broadcastToRoom('user-left', {
            message: '[' + this._user['name'] + '] has left the vChat room.',
            chatClass: this._systemMessageClass['warning']
        });
        this._redisCtrl.removeUserFromRoom(this._roomHash, this._user);
    }

    getRoomHash() {
        return this._roomHash;
    }

    getSocketId() {
        return this._socketId;
    }

    /* 
     * Parse room hash from socket object. 
     */
    _getRoomHash(socket) {
        var referer = socket.handshake.headers.referer;
        referer = referer.split('/');
        return referer[referer.length - 1];
    }


    /***** Chat & video  handlers *****/
    /* 
     * Broadcast chat message to all in the room.
     */
    chatFromClient(data) {
        this._broadcastInRoom('new-message', data);
    }

    /* 
     * Validate youtube video, and add it to queue. 
     */
    newVideoSubmit(data) {
        // TODO: Update this logic to be more powerful. Temporary now.
        if (!data['link'].startsWith('https://www.youtube.com/watch?v=') 
            && !data['link'].startsWith('https://youtu.be/')) {
            this._logger.log('Invalid video link: ' + data['link']);
            return;
        }

        if (data['link'].startsWith('https://youtu.be/')) {
            // This link is provided by Share menu.
            // So the link to embeded format.
            let link = data['link'].split('/');
            link = link[link.length -1];
            let id = link;

            if (link.indexOf('?t=') >= 0) {
                // This link contains start time..so change the format!
                link = link.split('?');
                link[1] = link[1].replace('t=', '');
                let startAt = link[1].split('m');
                if (startAt.length > 1) {
                    // Format of t=1m33s..
                    let min = startAt[0];
                    let sec = startAt[1].replace('s', '');
                    startAt = {
                        min: min,
                        sec: sec
                    };
                } else {
                    startAt = parseInt(startAt[0]);
                }
                id = link[0];
                data['startAt'] = startAt;
            }

            data['videoId'] = id;
        } else {
            // Look closely! Not a duplicated code!
            let id = data['link'].split('/');
            id = id[id.length - 1].replace('watch?v=', '');
            
            if (id.indexOf('&t=') >= 0) {
                let link = id.split('&');
                id = link[0];
                link[1] = link[1].replace('t=', '');
                let startAt = link[1].split('m');
                if (startAt.length > 1) {
                    // Format of t=1m33s..
                    let min = startAt[0];
                    let sec = startAt[1].replace('s', '');
                    startAt = {
                        min: min,
                        sec: sec
                    }
                } else {
                    startAt = parseInt(startAt[0]);
                }
                link = link[0];
                data['startAt'] = startAt;
            } 

            data['videoId'] = id;
        }

        delete data['link'];

        // TODO: And probably verify given link is a real youtube video?
        this._redisCtrl.queueVideo(data, () => {
            // Callback for when queueing is done.
            data['message'] = 'queued new video!';
            data['chatClass'] = this._systemMessageClass['info'];
            this._broadcastInRoom('new-video-queued', data)
        }, (nextVideo) => {
            // This will be executed if there is no video currently playing.
            this._broadcastInRoom('new-video-to-play', nextVideo);
        });
    }

    controlVideo(data) {
        data['chatClass'] = this._systemMessageClass['action'];
        if (data['action'] == 'playNext') {
            this._redisCtrl.playNextVideo((nextVideo) => {
                if (nextVideo !== null) { 
                    data['nextVideo'] = nextVideo;
                    this._broadcastInRoom('control-video', data);
                } else {
                    this._broadcastInRoom('no-more-video', {
                        chatClass: this._systemMessageClass['warning']
                    });
                }
            });
        } else {
            this._broadcastInRoom('control-video', data);
        }
    }

    /* 
     * Broadcast to all in room. 
     */
    _broadcastInRoom(eventName, data) {
        this._io.sockets.in(this._roomHash).emit(eventName, data);
    }

    /* 
     * Broadcast to all except message sender in room. 
     */
    _broadcastToRoom(eventName, data) {
        this._socket.broadcast.to(this._roomHash).emit(eventName, data);
    }
}

exports.SocketController = SocketController;


