var roomInfo = {};
var readyForRoombeat = false;
var isPopOut = false;
var player;
var socket;
var roombeat;
var numMessages = 0;
var pauseAfterLoad = false;
// Whether video paused via controller or not.
var actionPause = false;
// Whether video resumed/played via controller or not.
var actionResume = false;
// Whether socket connection was disconnected.
var wasDisconnected = false;
var $currentPlayTime, timer;
var MESSAGE_TYPES = {
  info: 'system-message-info',
  warning: 'system-message-warning',
  action: 'system-message-action'
};

$(document).ready(function () {
  socket = io.connect(CONFIG['socketServer']);
  roombeat = io.connect(CONFIG['roombeatServer']);
  $currentPlayTime = $('#current-play-time');
  _setRoomInfo();

  /***** Roombeat *****/
  roombeat.on('roombeat', respondRoombeat);
  socket.on('ready-for-roombeat', listenToRoombeat);

  /***** Socket events *****/
  socket.on('system-message', updateChat);
  socket.on('new-message', updateChat);
  socket.on('username-update', updateUserName);
  socket.on('new-video-queued', updateChat);
  socket.on('new-video-to-play', loadVideo);
  socket.on('control-video', controlVideo);
  socket.on('get-current-play-time-for-new-user', getCurrentPlayTimeForNewUser);
  socket.on('no-more-video', noMoreVideo);
  socket.on('force-disconnect', forceDisconnect);
  socket.on('disconnect', onDisconnect);
  socket.on('connect', onConnect);


  /***** Regular events *****/
  $('#chat-input').on('keypress', _onChatInputSubmit);
  $('#video-input').on('keypress', _onVideoSubmit);
  $('.video-control-button').on('click', _onVideoControl);
});

function onDisconnect() {
  $('#connection-lost-dialog').removeClass('hide');
  wasDisconnected = true;
  player.stopVideo();
}

function onConnect() {
  var $connectionLost = $('#connection-lost');
  var $reconnect = $('#reconnect');
  if (wasDisconnected) {
    $connectionLost.addClass('hide');
    $reconnect.removeClass('hide');
    socket.emit('get-current-play-time-for-new-user');
    wasDisconnected = false;
    setTimeout(function() {
      $('#connection-lost-dialog').addClass('hide');
      $connectionLost.removeClass('hide');
      $reconnect.addClass('hide');
    }, 3000);
  }
}

function _onChatInputSubmit(e) {
  var $chatInput = $('#chat-input');
  if (e.which == 13) {
    var data = {
      username: _getUserName(),
      message: $.trim($chatInput.val())
    };

    if (data['message'] !== '') {
      if (/^http(s)?:\/\//.test(data['message']) === true) {
        data['html'] = true;
        data['link'] = true;
      }
      socket.emit('client-chat-send', data);
    }
    $chatInput.val('');
  }
}

function _setRoomInfo() {
  updateChat({
    message: 'Welcome to vChat!',
    messageType: 'info'
  });
  var path = window.location.pathname;
  if (path.startsWith('/popout')) {
    isPopOut = true;
    // Notify users that this user is a pop out view.
    socket.emit('pop-out-user');
    return;
  }

  path = path.replace('/vChat/', '').split('/');
  roomInfo['type'] = path[0];
  roomInfo['name'] = path[1];
}

function _onVideoSubmit(e) {
  var $videoInput = $('#video-input');
  if (e.which == 13) {
    var data = {
      username: _getUserName(),
      link: $videoInput.val(),
      submitType: 'link'
    };

    socket.emit('new-video-submit', data);
    $videoInput.val('');
  }
}

function _onVideoControl(e) {
  var id = $(e.currentTarget).attr('id');
  switch (id) {
    case 'video-controller-time':
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
      break;
    case 'video-controller-pause':
      // Only emit if video is currently playing.
      if (isPlayerPlaying()) {
        var data = {
          username: _getUserName(),
          action: 'pause'
        };
        socket.emit('control-video', data);
      }
      break;
    case 'video-controller-resume':
      // Only emit if video is currently paused.
      if (isPlayerPaused()) {
        var data = {
          username: _getUserName(),
          action: 'resume'
        };
        socket.emit('control-video', data);
      }
      break;
    case 'video-controller-play-next':
      // Only emit when we have a video.
      // TODO: Change this emit to only happen for when queue.length > 0
      if (hasVideo()) {
        var data = {
          username: _getUserName(),
          action: 'playNext'
        };
        socket.emit('control-video', data);
      }
      break;
  }
}

function _getUserName() {
  return $('#user-name').val();
}

function updateChat(data) {
  // Put message on chat box.
  var message = '';

  if (typeof data['link'] !== 'undefined' && data['link'] === true) {
    data['message'] = '<a href="' + data['message'] + '" target="_blank">' + data['message']
                      + '</a>';
  }

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
  // Ignore if no data was sent.
  if (typeof data === 'undefined') return;

  // Video is loaded via server.
  actionResume = true;
  var message = null;
  var messageType = null;
  if (typeof data['currentVideoForNewUser'] !== 'undefined' && data['currentVideoForNewUser']) {
    // Add 0.5 for loading time..better than adding nothing.
    var deltaTime = Math.round((new Date().getTime() - parseInt(data['timestamp'])) / 1000 + 0.5);
    data['startAt'] = parseInt(data['startAt']) + deltaTime;
  }

  if (typeof data['message'] !== 'undefined' && typeof data['messageType'] !== 'undefined') {
    message = data['message'];
    messageType = data['messageType'];
  }

  if (message !== null) {
    updateChat({
      message: message,
      messageType: messageType
    });
  }

  var videoData = {
    videoId: data['videoId']
  };

  if (typeof data['startAt'] !== 'undefined') {
    if (typeof data['startAt'] === 'number') {
      videoData['startSeconds'] = data['startAt'];
    } else {
      videoData['startSeconds'] = (parseInt(data.startAt['min']) * 60)
                                  + parseInt(data.startAt['sec']);
    }
  } else if (typeof data['startSeconds'] !== 'undefined') {
    videoData['startSeconds'] = data['startSeconds'];
  }

  player.loadVideoById(videoData);

  // Current video play or stop for new user.
  if (typeof data['isPlaying'] !== 'undefined' && !data['isPlaying']) {
    pauseAfterLoad = true;
    // Current video is paused, so player will pause the video right after it is loaded.
    actionResume = false;
  }
}

function controlVideo(data) {
  var message = '';
  switch (data['action']) {
    case 'startAt':
      var startAt = 0;
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
      actionPause = true;
      actionResume = false;
      player.pauseVideo();
      break;
    case 'resume':
      message = 'resumed video!';
      actionPause = false;
      actionResume = true;
      player.playVideo();
      break;
    case 'playNext':
      message = 'played next video!';
      loadVideo(data['nextVideo']);
      break;
    case 'playNextFromQueue':
      message = 'Playing next video from the queue.';
      setTimeout(function () {
        loadVideo(data['nextVideo']);
      }, 1500);
      break;
    case 'playRelatedVideo':
      message = 'Queue is empty. Playing a related video from the last played video.';
      setTimeout(function () {
        loadVideo(data['nextVideo']);
      }, 1500);
      break;
    case 'noRelatedVideo':
      message = 'Queue is empty. Cannot find a related video from the last played video.';
      break;
  }

  var chatData = {
    username: data['username'],
    message: message
  };

  if (typeof data['messageType'] !== 'undefined') {
    chatData['messageType'] = data['messageType'];
  }

  updateChat(chatData);
}

function noMoreVideo(data) {
  data['message'] = 'No more videos to play.';
  updateChat(data);
}

/*
 * Append given message to the chatbox.
 * Chatbox will only contain 30 messages at most.
 */
function _appendToChatBox(data) {
  // For pop out window, only append system message.
  if (isPopOut && (typeof data['messageType'] === 'undefined' || data['messageType'] === null)) {
    return;
  }
  if (numMessages < 30) numMessages++;
  var $chatBox = $('#chat-messages');
  var classes = ['chat-message'];

  // If chatClass is defined directly, use chatClass.
  if (typeof data['chatClass'] !== 'undefined' && data['chatClass'] !== null) {
    classes.push(data['chatClass']);
  } else if (typeof data['messageType'] !== 'undefined' && data['messageType'] !== null) {
    // If messageType is defined, use it.
    classes.push(MESSAGE_TYPES[data['messageType']]);
  }

  // If this chat message is by current user itself, add background color.
  if ((typeof data['username'] !== 'undefined') && data['username'] === $('#user-name').val()){
    classes.push('chat-self');
  }

  if (typeof data['html'] !== 'undefined' && data['html'] === true) {
    // No action here.
  } else {
    data['message'] = app.escapeHTML(data['message']);
  }

  // Append to chat box.
  $chatBox.append('<div class="' + classes.join(' ') + '">' + data['message'] + '</div>');

  if (isPopOut) {
    $('#pop-out-chat-box-wrapper').scrollTop($chatBox.height());
  } else {
    $('#chat-box-wrapper').scrollTop($chatBox.height());
  }

  // Remove the top message if there are more than 30 messages.
  if (numMessages >= 30) {
    $chatBox.children().first().remove();
  }
}

function getCurrentPlayTimeForNewUser(data) {
  data['startAt'] = parseInt(player.getCurrentTime());
  // Don't rely on player state. Use client variable to determine if video is playing or not.
  data['isPlaying'] = !actionPause && !pauseAfterLoad;
  data['isEnded'] = isPlayerEnded();
  data['timestamp'] = new Date().getTime();
  data['currentVideoId'] = player.getVideoData().video_id;
  socket.emit('current-play-time-for-new-user', data);
}

function forceDisconnect() {
  // V1, just force close or redirect.
  // TODO: alert dialog saying detected new connection, closing current tab / pop out.
  if (isPopOut) {
    window.self.close();
  } else {
    window.location.href = CONFIG['baseUrl'];
  }
}


/***** Youtube API Handlers *****/
function onYouTubePlayerAPIReady() {
  /* API setup. */
  player = new YT.Player('video-content', {
    width: '800',
    height: '450',
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

function onPlayerReady() {
  /* Play video if video_id has value. */
  app.log('Youtube Player is ready.');

  if (player.getVideoData().video_id !== null) {
    player.playVideo();
  }

  socket.emit('get-current-play-time-for-new-user');
}

function onPlayerStateChange(event) {
  var $videoWrapper;
  if (isPopOut) {
    $videoWrapper = $('#pop-out-video-wrapper');
  } else {
    $videoWrapper = $('#video-wrapper');
  }

  /* When current video ends, try to load next video on queue from server. */
  // Always clear interval on state change.
  clearInterval(timer);
  switch (event.data) {
    case 0: // Current video ended.
      $videoWrapper.addClass('no-pointer-events');
      break;
    case 1: // Started/Resumed playing.
      $videoWrapper.removeClass('no-pointer-events');
      if (pauseAfterLoad) {
        actionPause = true;
        player.pauseVideo();
        pauseAfterLoad = false;
      } else if (!actionResume) {
        player.pauseVideo();
      }
      setVideoInformation();
      break;
    case 2: // Video paused.
      if (!actionPause) {
        player.playVideo();
      }
      break;
  }
}

/*
 * Set video information and start timer.
 */
function setVideoInformation() {
  var videoData = player.getVideoData();
  var durationText = _getFormattedTime(player.getDuration());
  var url = player.getVideoUrl();
  var $videoName = $('#current-video-name');
  $videoName.text(videoData['title']);
  $videoName.attr('title', videoData['title']);
  $('#current-video-duration').text(durationText);
  $('#current-video-youtube-link').html('<a href="' + url + '" target="_blank">Watch at YouTube</a>');
  var currentTime = player.getCurrentTime();
  $currentPlayTime.attr('data-seconds', currentTime);
  _setTimer();
  timer = setInterval(_setTimer, 1000);
}

function _setTimer() {
  var time = parseInt($currentPlayTime.attr('data-seconds'));
  var newTime = _getFormattedTime(time);
  $currentPlayTime.attr('data-seconds', time + 1);
  $currentPlayTime.text(newTime + ' / ');
}

function _getFormattedTime(seconds) {
  var min = Math.floor(seconds / 60);
  var sec = parseInt(seconds - (min * 60));
  if (sec < 10) sec = '0' + sec;
  return '' + min + ':' + sec;
}

function isPlayerPlaying() {
  return _getPlayerState() == 'playing';
}

function isPlayerPaused() {
  var videoId = player.getVideoData()['video_id'];
  return videoId !== null &&
      (_getPlayerState() == 'paused' || _getPlayerState() == 'not_started');
}

function isPlayerEnded() {
  return _getPlayerState() == 'ended';
}

function _getPlayerState() {
  var state = '';
  switch (player.getPlayerState()) {
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
      state = 'not_started';
      break;
  }

  return state;
}

function hasVideo() {
  var videoData = player.getVideoData();
  return videoData['video_id'] !== null;
}

/*
 * Responds to roombeat if this socket is selected for roombeat :).
 * Will only respond if current video is ended for now.
 */
function listenToRoombeat() {
  setTimeout(function() {
    app.log('Ready to respond to Roombeat');
    readyForRoombeat = true;
  }, 1000);
}

function respondRoombeat() {
  if (!readyForRoombeat) {
    setTimeout(function() {
      respondRoombeat();
    }, 100);
    return;
  }

  var playerEnded = isPlayerEnded();
  app.log('Responding to Roombeat | Player ended: ' + playerEnded);

  if (playerEnded) {
    var data = {
      videoId: player.getVideoData()['video_id'],
      isVideoEnded: true
    };
    roombeat.emit('roombeat', data);
  }
}
