var express = require('express');
var Logger = require('../app_modules/logger').Logger;

class RoombeatController {

    constructor(redisClient, io) {
        this._redisClient = redisClient;
        this._io = io;
    }

    currentVideoEnded(message) {
        let data = JSON.parse(message);
        if (data['videoEnded']) {
            this._redisClient.get(data['videoKey'], (err, videoData) => {
                if (err) throw err;

                videoData = JSON.parse(videoData);
                if (videoData !== null && videoData.currentVideo != null &&
                    videoData.currentVideo['videoId'] == data['videoId']) {
                    let nextVideo = videoData.queue.shift();
                    videoData.currentVideo = nextVideo;

                    // Set to redis ASAP.
                    this._redisClient.set(data['videoKey'], JSON.stringify(videoData));
                    // Notify user to play next video.
                    if (typeof nextVideo !== 'undefined' && nextVideo !== null) {
                        let controlVideo = {
                            action: 'playNextFromQueue',
                            nextVideo: nextVideo
                        }
                        this._io.sockets.in(data['roomKey']).emit('control-video', controlVideo);
                        console.log('Automatically playing the next video from the queue for room: ['
                            + data['roomKey'] + ']');
                    }
                }
            });
        }
    }

}

exports.RoombeatController = RoombeatController;


