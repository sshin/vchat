/***** youtube api *****/

var player;
var socket;
var roombeat;
var numMessages = 0;
var pauseAfterLoad = false;
var $currentPlayTime, timer;

$(document).ready(function () {
  socket = io.connect('http://vchat-socket.nullcannull-dev.net');
  roombeat = io.connect('http://vchat-roombeat.nullcannull-dev.net');
  $currentPlayTime = $('#current-play-time');

  /***** Roombeat *****/
  roombeat.on('roombeat', respondRoombeat);

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
  $('#chat-input').on('keypress', _onChatInputSubmit);
  $('#video-input').on('keypress', _onVideoSubmit);
  $('.video-control-button').on('click', _onVideoControl);
});

function _onChatInputSubmit(e) {
  var $chatInput = $('#chat-input');
  if (e.which == 13) {
    var data = {
      username: _getUserName(),
      message: $.trim($chatInput.val())
    };

    if (data['message'].toLowerCase() == 'what is the current video?') {
      var videoData = player.getVideoData();
      if (videoData['video_id'] !== null) {
        updateChat({
          html: true,
          message: 'Name of the video is <a href="' + player.getVideoUrl()
          + '" target="_blank">' + videoData['title'] + '</a>',
          chatClass: 'system-message-info'
        });
      } else {
        updateChat({
          message: 'There is no video playing.',
          chatClass: 'system-message-info'
        });
      }
    } else if (data['message'] !== '') {
      if (/^http(s)?:\/\//.test(data['message']) === true) {
        data['html'] = true;
        data['link'] = true;
      }
      socket.emit('client-chat-send', data);
    }
    $chatInput.val('');
  }
}

function _onVideoSubmit(e) {
  var $videoInput = $('#video-input');
  if (e.which == 13) {
    var data = {
      username: _getUserName(),
      link: $videoInput.val()
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
        }
        socket.emit('control-video', data);
      }
      break;
  }
}

function _getUserName() {
  return $('#user-name').val();
}

function updateChat(data) {
  /* Put message on chat box. */
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

  var message, chatClass;
  if (typeof data['currentVideo'] !== 'undefined') {
    message = 'You will be synced with the current video.';
    chatClass = 'system-message-info';
    // Add 0.5 for loading time..better than adding nothing.
    var deltaTime = Math.ceil((new Date().getTime() - parseInt(data['timestamp'])) / 1000 + 0.5);
    data['startAt'] = parseInt(data['startAt']) + deltaTime;
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
    pauseAfterLoad = true;
  }
}

function controlVideo(data) {
  var message = '';
  switch (data['action']) {
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
    case 'playNextFromQueue':
      updateChat({
        message: 'Playing next video from the queue.',
        chatClass: 'system-message-info'
      });

      setTimeout(function () {
        loadVideo(data['nextVideo']);
      }, 1500);
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

/*
 * Append given message to the chatbox.
 * Chatbox will only contain 30 messages at most.
 */
function _appendToChatBox(data) {
  if (numMessages < 30) numMessages++;
  var $chatBox = $('#chat-messages');
  var classes = 'chat-message';
  if (typeof data['chatClass'] !== 'undefined') classes += ' ' + data['chatClass'];

  // If this chat message is by current user itself, add background color.
  if ((typeof data['username'] !== 'undefined') && data['username'] === $('#user-name').val()){
    classes += ' ' + 'chat-self';
  }

  if (typeof data['html'] !== 'undefined' && data['html'] === true) {
    // No action here.
  } else {
    data['message'] = app.escapeHTML(data['message']);
  }

  $chatBox.append('<div class="' + classes + '">' + data['message'] + '</div>');
  $('#chat-box-wrapper').scrollTop($chatBox.height());

  // Remove the top message if there are more than 30 messages.
  if (numMessages >= 30) {
    $('#chat-messages').children().first().remove();
  }
}

function getCurrentPlayTimeForNewUser(data) {
  data['startAt'] = parseInt(player.getCurrentTime());
  data['isPlaying'] = isPlayerPlaying();
  data['timestamp'] = new Date().getTime();
  socket.emit('current-play-time-for-new-user', data);
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
  // Always clear interval on state change.
  clearInterval(timer);
  switch (event.data) {
    case 0:
      // Currnet video ended. Are we going to display something?
      break;
    case 1:
      // Started/Resumed playing.
      if (pauseAfterLoad) {
        player.pauseVideo();
        pauseAfterLoad = false;
      }
      setVideoInformation();
      break;
    case 2:
      // Paused.
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
function respondRoombeat() {
  if (isPlayerEnded()) {
    var data = {
      videoId: player.getVideoData()['video_id'],
      isVideoEnded: true
    };
    roombeat.emit('roombeat', data);
  }
}

