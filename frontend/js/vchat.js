/***** youtube api *****/

var player;
var socket;

$(document).ready(function() {

    socket = io.connect('http://vchat-socket.nullcannull-dev.net');
    var $chatInput = $('#chat-input');
    var $videoInput = $('#video-input');
    var $controlTime = $('#video-controller-time');

    /***** Socket events *****/
    socket.on('new-user-entered', updateChat);
    socket.on('new-message', updateChat);
    socket.on('username-update', updateUserName);
    socket.on('user-left', updateChat);
    socket.on('new-video-queued', updateChat);
    socket.on('new-video-to-play', loadVideo);
    socket.on('control-video', controlVideo);
    socket.on('get-current-play-time-for-new-user', getCurrentPlayTimeForNewUser);
    socket.on('no-more-video', noMoreVideo);
    

    /***** Regular events *****/
    $chatInput.on('keypress', function(e) {
        if (e.which == 13) {
            var data = {
                username: _getUserName(),
                message: $chatInput.val()
            };

            socket.emit('client-chat-send', data);
            $chatInput.val('');
       }
    });

    $videoInput.on('keypress', function(e) {
        if (e.which == 13) {
            var data = {
                username: _getUserName(),
                link: $videoInput.val()
            };

            socket.emit('new-video-submit', data);
            $videoInput.val('');
        }
    });

    $controlTime.on('click', function() {
        var videoId = player.getVideoData().video_id;
        if (videoId !== null) {
            var min = $('#video-control-minutes').val();
            var sec = $('#video-control-seconds').val();
            if (!min || /[^0-9]/.test(min)) min = 0;
            if (!sec || /[^0-9]/.test(sec)) sec = 0;
            var data = {
                username: _getUserName(),
                action: 'startAt',
                startAt: {
                    min: min,
                    sec: sec
                }
            };
            socket.emit('control-video', data);
        }
    });

    $('#video-resume').on('click', function() {
        // Only emit if video is currently paused.
        if (isPlayerPaused()) {
            var data = {
                username: getUserName(),
                action: 'resume'
            };
            socket.emit('control-video', data);
        }
    });

    $('#video-pause').on('click', function() {
        // Only emit if video is currently playing.
        if (isPlayerPlaying()) {
            var data = {
                username: _getUserName(),
                action: 'pause'
            };
            socket.emit('control-video', data);
        }
    });

    $('#video-play-next').on('click', function() {
        // Only emit when we have a video.
        // TODO: Change this emit to only happen for when queue.length > 0
        if (hasVideo()) {
            var data = {
                username: _getUserName(),
                action: 'playNext'
            }
            socket.emit('control-video', data);
        }
    });
});

function _getUserName() {
    return $('#user-name').val();
}

function updateChat(data) {
/* Put message on chat box. */
    var message = '';

    if (typeof data['username'] !== 'undefined') {
        message += '[' + data['username'] + '] ';
    }

    message += data['message'];

    data['message'] = message;
   _appendToChatBox(data);
}

function updateUserName(data) {
    $('#user-name').val(data['username']);
}

function loadVideo(data) {
    var message, chatClass; 
    if (data['currentVideo']) {
        message = 'You will be synced with the current video.';
        chatClass = 'system-message-info';
    } else {
        message = 'Next video will be played shortly.';
        chatClass = 'system-message-warning';
    }

    updateChat({
        message: message,
        chatClass: chatClass
    });

    var videoData = {
        videoId: data['videoId']
    };

    if (typeof data['startAt'] !== 'undefined') {
        if (typeof data['startAt'] === 'number') {
            videoData['startSeconds'] = data['startAt'];
        } else {
            videoData['startSeconds'] = (parseInt(data.startAt['min']) * 60) + parseInt(data.startAt['sec']);
        }
    } else if (typeof data['startSeconds'] !== 'undefined') {
        videoData['startSeconds'] = data['startSeconds'];
    }

    player.loadVideoById(videoData);

    if (typeof data['isPlaying'] !== 'undefined' && !data['isPlaying']) {
        // This is hacky...need to find a better way to do this.
        setTimeout(function() {
            player.pauseVideo();
        }, 1000);
    }
}

function controlVideo(data) {
    var message = '';
    switch(data['action']) {
        case 'startAt':
            message = 'adjusted video!';
            if (typeof data['startAt'] === 'number') {
                startAt = data['startAt'];
            } else {
                startAt = (parseInt(data.startAt['min']) * 60) + parseInt(data.startAt['sec']);
            }
            player.seekTo(startAt);
            break;
        case 'pause':
            message = 'paused video!';
            player.pauseVideo();
            break;
        case 'resume':
            message = 'resumed video!';
            player.playVideo();
            break;
        case 'playNext':
            message = 'played next video!';

            // We want to disply this chat first...
            // TODO: Find better way to do this.
            updateChat({
                username: data['username'],
                message: message,
                chatClass: data['chatClass']
            });

            // TODO: Handle situation where no more next video.
            loadVideo(data['nextVideo']);
            return;
    }

    updateChat({
        username: data['username'],
        message: message,
        chatClass: data['chatClass']
    });
}

function noMoreVideo(data) {
    data['message'] = 'No more videos to play.';
    updateChat(data);
}

function _appendToChatBox(data) {
    var $chatBox = $('#chat-messages');
    var classes ='chat-message';
    if (typeof data['chatClass'] !== 'undefined') classes += ' ' + data['chatClass'];

    $chatBox.append('<div class="' + classes + '">' + data['message']  + '</div>');
    $('#chat-box-wrapper').scrollTop($chatBox.height());
}

function getCurrentPlayTimeForNewUser(data) {
    data['startAt'] = parseInt(player.getCurrentTime());
    data['isPlaying'] = isPlayerPlaying();
    socket.emit('current-play-time-for-new-user', data);
}

/***** Youtube API Handlers *****/
function onYouTubePlayerAPIReady() {
/* API setup. */
    player = new YT.Player('video-content', {
        width: '600',
        height: '338',
        videoId: '',
        playerVars: {
            autoplay: 1, // Autoplay when vidoe is loaded.
            controls: 0, // Do not display controller.
            rel: 0, // Don't show related videos when video ends.
            disablekb: 1, // Disable keyboard control.
            modestbranding: 1, // Don't show YouTube logo while playing.
            showinfo: 0,
            iv_load_policy: 3 // Don't show any annotations.
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

}

function onPlayerReady(event) {
/* Play video if video_id has value. */
    console.log('Youtube Player is ready.');
    
    if (player.getVideoData().video_id !== null) {
        player.playVideo();
    }

    socket.emit('get-current-play-time-for-new-user');

}

function onPlayerStateChange(event) {
/* When current video ends, try to load next video on queue from server. */
    if (event.data == 0) {
        console.log('Current video ended.');
        updateChat({
            message: 'Video ended. Replaying current video.',
            chatClass: 'system-message-info'
        });
        player.playVideo();
    }
}

function isPlayerPlaying() {
    return _getPlayerState() == 'playing';
}

function isPlayerPaused() {
    var videoId = player.getVideoData()['video_id'];
    return videoId !== null && 
        (_getPlayerState() == 'paused' || _getPlayerState() == 'not_started');
}

function _getPlayerState() {
    var state = '';
    switch(player.getPlayerState()) {
        case -1:
            state = 'not_started';
            break;
        case 0:
            state = 'ended';
            break;
        case 1:
            state = 'playing';
            break;
        case 2:
            state = 'paused';
            break;
        default:
            state = 'notstarted';
            break;
    }

    return state;
}

function hasVideo() {
    var videoData = player.getVideoData();
    return videoData['video_id'] !== null;
}

