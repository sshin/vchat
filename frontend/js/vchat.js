var roomInfo = {};
var numMessages = 0;
var pauseAfterLoad = false;
// Whether video paused via controller or not.
var actionPause = false;
// Whether video resumed/played via controller or not.
var actionResume = false;
// Whether socket connection was disconnected.
var wasDisconnected = false;
var $currentPlayTime, timer;
var focusingOnApp = true;
var MESSAGE_TYPES = {
  info: 'system-message-info',
  warning: 'system-message-warning',
  action: 'system-message-action'
};

$(document).ready(function () {
  vChat.socket = io.connect(CONFIG['socketServer']);
  vChat.roombeat = io.connect(CONFIG['roombeatServer']);
  $currentPlayTime = $('#current-play-time');
  _setRoomInfo();
  _initializeNotification();

  /***** Roombeat *****/
  vChat.roombeat.on('roombeat', vChat.respondRoombeat);
  vChat.socket.on('ready-for-roombeat', vChat.listenToRoombeat);

  /***** Socket events *****/
  vChat.socket.on('system-message', updateChat);
  vChat.socket.on('new-message', updateChat);
  vChat.socket.on('username-update', updateUserName);
  vChat.socket.on('new-video-queued', updateChat);
  vChat.socket.on('new-video-to-play', loadVideo);
  vChat.socket.on('control-video', controlVideo);
  vChat.socket.on('get-current-play-time-for-new-user', getCurrentPlayTimeForNewUser);
  vChat.socket.on('connect', onConnect);
  vChat.socket.on('disconnect', onDisconnect);
  vChat.socket.on('force-disconnect', vChat.forceDisconnect);


  /***** Regular events *****/
  $('#chat-input').on('keypress', _onChatInputSubmit);
  $('#video-input').on('keypress', _onVideoSubmit);
  $('.video-control-button').on('click', _onVideoControl);
});

function _initializeNotification() {
  if (!app.html5NotificationSupported()) return;

  if (!app.html5NotificationPermissionGranted()) {
    Notification.requestPermission();
  }

  app.notificationAudio = $('#notification-sound');
  $(window).on('blur', _onWindowBlur);
  $(window).on('focus', _onWindowFocus);
}

function _useHtml5Notification() {
  return app.html5NotificationSupported() && app.html5NotificationPermissionGranted();
}

function _onWindowBlur() {
  focusingOnApp = false;
}

function _onWindowFocus() {
  focusingOnApp = true;
}

function onDisconnect() {
  $('#connection-lost-dialog').removeClass('hide');
  wasDisconnected = true;
  vChat.player.stopVideo();
}

function onConnect() {
  var $connectionLost = $('#connection-lost');
  var $reconnect = $('#reconnect');
  if (wasDisconnected) {
    $connectionLost.addClass('hide');
    $reconnect.removeClass('hide');
    vChat.socket.emit('get-current-play-time-for-new-user');
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
      type: 'message',
      username: _getUserName(),
      message: $.trim($chatInput.val())
    };

    if (data['message'] !== '') {
      if (/^http(s)?:\/\//.test(data['message']) === true) {
        data['html'] = true;
        data['link'] = true;
      }
      vChat.socket.emit('client-chat-send', data);
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
    vChat.isPopOut = true;
    // Notify users that this user is a pop out view.
    vChat.notifyPopOutUser();
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

    vChat.socket.emit('new-video-submit', data);
    $videoInput.val('');
  }
}

function _onVideoControl(e) {
  var id = $(e.currentTarget).attr('id');
  switch (id) {
    case 'video-controller-time':
      var videoId = vChat.player.getVideoData().video_id;
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
        vChat.socket.emit('control-video', data);
      }
      break;
    case 'video-controller-pause':
      // Only emit if video is currently playing.
      if (vChat.isPlayerPlaying()) {
        var data = {
          username: _getUserName(),
          action: 'pause'
        };
        vChat.socket.emit('control-video', data);
      }
      break;
    case 'video-controller-resume':
      // Only emit if video is currently paused.
      if (vChat.isPlayerPaused()) {
        var data = {
          username: _getUserName(),
          action: 'resume'
        };
        vChat.socket.emit('control-video', data);
      }
      break;
    case 'video-controller-play-next':
      // Only emit when we have a video.
      // TODO: Change this emit to only happen for when queue.length > 0
      if (vChat.hasVideo()) {
        var data = {
          username: _getUserName(),
          action: 'playNext'
        };
        vChat.socket.emit('control-video', data);
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

  switch(data['type']) {
    case 'sticker':
      data['html'] = true;
      message = _buildSticker(data);
      break;
    default:
      message = _buildMessage(data);
      break;
  }

  data['message'] = message;
  _appendToChatBox(data);
  _notifyNewMessage(message, data);
}

function _buildMessage(data) {
  var message = '';

  if (typeof data['link'] !== 'undefined' && data['link'] === true) {
    data['message'] = '<a href="' + data['message'] + '" target="_blank">' + data['message']
                      + '</a>';
  }

  if (typeof data['username'] !== 'undefined') {
    message += '[' + data['username'] + '] ';
  }

  message += data['message'];
  return message;
}

function _buildSticker(data) {
  var prefix = '[' + data['username'] + '] ';
  return prefix + '<div><img src="/assets/stickers/' + data['stickerName'] + '/' + data['stickerNum'] +'.' + data['extension'] + '"></div>';
}

/**
 * Play a notification sound if user is not focusing on the app, and wants to be notified by messages.
 *
 * NOTE: System message will not trigger play.
 */
function _notifyNewMessage(message, data) {
  var notificationType = _getNotificationType(data['notificationType']);
  var currentTime = new Date().getTime();
  var turnToNotify = _isTurnToNotifyNewMessage(currentTime, notificationType);

  if (!focusingOnApp && notificationType && turnToNotify) {
    if (app.notificationSettings['sounds'][notificationType]) {
      app.notificationAudio.volume = 1.0;
      app.notificationAudio.trigger('play');
    }

    if (_useHtml5Notification() && app.notificationSettings['html5Notifications'][notificationType]) {
      if (typeof data['type'] !== 'undefined' && data['type'] === 'sticker') {
        message = '[' + data['username'] + '] sent a sticker!';
      }
      _spawnNotification(_getNotificationTitle(notificationType), message, notificationType);
    }
    app.notificationSettings['lastNotified'] = currentTime;
  }
}

function _getNotificationType(notificationType) {
  if (typeof notificationType === 'undefined') return null;
  return notificationType;
}

function _isTurnToNotifyNewMessage(currentTime, notificationType) {
  return (notificationType !== 'message' ||
           currentTime - app.notificationSettings['lastNotified'] > 4000);
}

function _getNotificationTitle(notificationType) {
  var title = 'vChat Notice';

  switch(notificationType) {
    case 'message':
      title = 'New vChat Message';
      break;
    case 'newVideoQueued':
      title = 'New Video Queued';
      break;
    case 'playNextVideo':
      title = 'Playing Next Video';
      break;
    case 'playRelatedVideo':
      title = 'Playing Related Video';
      break;
    case 'playQueuedVideo':
      title = 'Playing Queued Video';
  }

  return title;
}

function _spawnNotification(title, message, notificationType) {
  var icon = _getNotificationIcon(notificationType);

  var options = {
    body: message,
    icon: icon
  };
  var n = new Notification(title, options);
  setTimeout(n.close.bind(n), 3700);
}

function _getNotificationIcon(notificationType) {
  var prefix = '/assets/images/notification-icon-';
  return prefix + notificationType + '.png';
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

  vChat.player.loadVideoById(videoData);

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
      vChat.player.seekTo(startAt);
      break;
    case 'pause':
      message = 'paused video!';
      actionPause = true;
      actionResume = false;
      vChat.player.pauseVideo();
      break;
    case 'resume':
      message = 'resumed video!';
      actionPause = false;
      actionResume = true;
      vChat.player.playVideo();
      break;
    case 'playNext':
      message = 'played next video!';
      loadVideo(data['nextVideo']);
      break;
    case 'playNextRelatedVideo':
      message = 'played a related video!';
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

  if (typeof data['notificationType'] !== 'undefined') {
    chatData['notificationType'] = data['notificationType'];
  }

  updateChat(chatData);
}

/*
 * Append given message to the chatbox.
 * Chatbox will only contain 30 messages at most.
 */
function _appendToChatBox(data) {
  // For pop out window, only append system message.
  if (vChat.isPopOut && (typeof data['messageType'] === 'undefined' || data['messageType'] === null)) {
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
  if ((typeof data['username'] !== 'undefined') &&
       data['username'] === $('#user-name').val() &&
       typeof data['notificationType'] !== 'undefined' && data['notificationType'] === 'message'){
    classes.push('chat-self');
  }

  if (typeof data['html'] !== 'undefined' && data['html'] === true) {
    // No action here.
  } else {
    data['message'] = app.escapeHTML(data['message']);
  }

  // Append to chat box.
  $chatBox.append('<div class="' + classes.join(' ') + '">' + data['message'] + '</div>');

  if (vChat.isPopOut) {
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
  data['startAt'] = parseInt(vChat.player.getCurrentTime());
  // Don't rely on player state. Use client variable to determine if video is playing or not.
  data['isPlaying'] = !actionPause && !pauseAfterLoad;
  data['isEnded'] = vChat.isPlayerEnded();
  data['timestamp'] = new Date().getTime();
  data['currentVideoId'] = vChat.player.getVideoData().video_id;
  vChat.socket.emit('current-play-time-for-new-user', data);
}


/***** Youtube API Handlers *****/
function onYouTubePlayerAPIReady() {
  /* API setup. */
  vChat.player = new YT.Player('video-content', {
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

  if (vChat.player.getVideoData().video_id !== null) {
    vChat.player.playVideo();
  }

  vChat.socket.emit('get-current-play-time-for-new-user');
}

function onPlayerStateChange(event) {
  var $videoWrapper;
  if (vChat.isPopOut) {
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
        vChat.player.pauseVideo();
        pauseAfterLoad = false;
      } else if (!actionResume) {
        vChat.player.pauseVideo();
      }
      setVideoInformation();
      break;
    case 2: // Video paused.
      if (!actionPause) {
        vChat.player.playVideo();
      }
      break;
  }
}

/**
 * Set video information and start timer.
 */
function setVideoInformation() {
  var videoData = vChat.player.getVideoData();
  var durationText = _getFormattedTime(vChat.player.getDuration());
  var url = vChat.player.getVideoUrl();
  var $videoName = $('#current-video-name');
  $videoName.text(videoData['title']);
  $videoName.attr('title', videoData['title']);
  $('#current-video-duration').text(durationText);
  $('#current-video-youtube-link').html('<a href="' + url + '" target="_blank">Watch at YouTube</a>');
  var currentTime = vChat.player.getCurrentTime();
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
