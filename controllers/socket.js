var express = require('express');
var Logger = require('../app_modules/logger').Logger;
var SocketRedisController = require('../controllers/socket_redis').SocketRedisController;


class SocketController {
    /*
     * SocketController for vchat-socket server.
     * Never throw errros in this controller because we don't want to restart socket server.
     * Find a way to handle errors.
     */

    constructor(io, redisClient, redisClient2, socket) {
        this._io = io;
        this._redisCtrl = new SocketRedisController(redisClient, redisClient2);
        this._roomHash = this._getRoomHash(socket);
        this._user = {id: socket.id};
        this._socket = socket;
        this._socket.join(this._roomHash);
        this._logger = new Logger();
        this._systemMessageClass = {
            blue: 'system-message-blue',
            red: 'system-message-red'
        };
        this._init();
    }

    /* 
     * Generate user name, and save it to Redis 
     */
    _init() {
        // TODO: Change the logic for generating user name.
        this._redisCtrl.getRoom(this._roomHash, function(data) {
            this._user['name'] = 'vChat User ' + this._socket['id'];
            this._socket.emit('username-update', {username: this._user['name']});
            this._redisCtrl.addUserToRoom(this._roomHash, this._user);
            this._broadcastToRoom('new-user-entered', {
                username: this._user['name'],
                chatClass: this._systemMessageClass['blue'],
                message: 'entered the vChat room.'
            });
        }.bind(this)); 
    }

    /*
     * User is leaving the chat room.
     * Romove from room and update all associated data.
     */
    leave() {
        this._broadcastToRoom('user-left', {
            message: '[' + this._user['name'] + '] has left the vChat room.',
            chatClass: this._systemMessageClass['red']
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
        var youtubePrefix = 'https://youtube.com/watch?v=';

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

            if (link.indexOf('?t=') >= 0) {
                // This link contains start time..so change the format!
                link = link.split('?');
                link[1] = link[1].replace('t=', '');
                let startAt = link[1].split('m');
                if (startAt.length > 1) {
                    // Format of t=1m33s..
                    let min = startAt[0];
                    let sec = startAt[1].replace('s', '');
                    startAt = (parseInt(min) * 60) + parseInt(sec);
                } else {
                    startAt = parseInt(startAt[0]);
                }
                link = link[0];
                data['startAt'] = startAt;
            }

            data['link'] = youtubePrefix + link;
        } else {
            // It's not same...that's why we have some duplicated codes.
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
                    startAt = (parseInt(min) * 60) + parseInt(sec);
                } else {
                    startAt = parseInt(startAt[0]);
                }
                link = link[0];
                data['startAt'] = startAt;
            } 

            data['link'] = youtubePrefix + id;
        }

        // TODO: And probably verify given link is a real youtube video?
        data['message'] = 'Queued new video!';
        this._broadcastInRoom('new-video-queued', data);

       // TODO: Queue it into something. Just broadcasting for testing.
       delete data['username'];
       this._broadcastInRoom('new-video-to-play', data); 
    }

    controlVideo(data) {
        if (typeof data.startAt !== 'undefined') {
            this._broadcastInRoom('current-video-start-at', data);
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


