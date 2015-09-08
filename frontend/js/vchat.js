$(document).ready(function() {
    var socket = io.connect('http://vchat-socket.nullcannull-dev.net');

    /***** Socket events *****/
    socket.on('new-user-entered', updateChat);
    socket.on('new-message', updateChat);
    socket.on('username-update', updateUserName);
    socket.on('user-left', updateChat);
    socket.on('new-video-queued', updateChat);
    socket.on('new-video-to-play', playVideo);
    socket.on('current-video-start-at', restartVideo);


    /***** Regular events *****/
    var $input = $('#chat-input');
    $input.on('keypress', function(e) {
        if (e.which == 13) {
            var data = {
                username: $('#user-name').text(),
                message: $input.val()
            };

            socket.emit('client-chat-send', data);
            $input.val('');
        }
    });

    var $videoInput = $('#video-input');
    $videoInput.on('keypress', function(e) {
        if (e.which == 13) {
            var data = {
                username: $('#user-name').text(),
                link: $videoInput.val()
            };

            socket.emit('new-video-submit', data);
            $videoInput.val('');
        }
    });

    var $controlTime = $('#video-controller-time');
    $controlTime.on('click', function() {
        var videoId = $('#video-content').attr('data-id');
        var min = $('#video-control-minutes').val();
        var sec = $('#video-control-seconds').val();
        if (!min) min = 0;
        if (!sec) sec = 0;
        var data = {
            videoId: videoId,
            startAt: {
                min: min,
                sec: sec
            }
        };
        socket.emit('control-video', data);
    });
});


function updateChat(data) {
    var message = '';

    if (typeof data['username'] !== 'undefined') {
        message += '[' + data['username'] + '] ';
    }

    message += data['message'];

    data['message'] = message;
   _appendToChatBox(data);
}

function updateUserName(data) {
    $('#user-name').text(data['username']);
}

function playVideo(data) {
    data['message'] = 'Next video will be played shortly.';
    updateChat(data);

    var startAt = '';
    if (typeof data['startAt'] !== 'undefined') {
        startAt = '&start=' + data['startAt'];
    }
    var videoId = data['videoId'];
    var $videoContent = $('#video-content');
    $videoContent.attr('data-id', videoId);
    $videoContent.html('<iframe width="600" height="338" src="https://www.youtube.com/embed/' 
                    + videoId  
                    + '?rel=0&amp;controls=0&amp;showinfo=0&autoplay=1' + startAt + '" frameborder="0"></iframe>');
}

function restartVideo(data) {
    if (typeof data.startAt !== 'undefined') {
        var startAt = (parseInt(data.startAt['min']) * 60) + parseInt(data.startAt['sec']);
        var $videoContent = $('#video-content');
        var videoId = data['videoId'];
        $videoContent.html('<iframe width="600" height="338" src="https://www.youtube.com/embed/' 
                        + videoId  
                        + '?rel=0&amp;controls=0&amp;showinfo=0&autoplay=1&start=' + startAt + '" frameborder="0"></iframe>');
    }
}

function _appendToChatBox(data) {
    var $chatBox = $('#chat-messages');
    var classes ='chat-message';
    if (typeof data['chatClass'] !== 'undefined') classes += ' ' + data['chatClass'];

    $chatBox.append('<div class="' + classes + '">' + data['message']  + '</div>');
    $('#chat-box-wrapper').scrollTop($chatBox.height());
}


