function vChatController() {
  // Socket object for vchat.
  this.socket = null;
  // Socket object for roombeat;
  this.roombeat = null;
  this.readyForRoombeat = false;
  // Youtube player.
  this.player = null;
  this.isPopOut = false;

  /** Socket **/
  this.notifyPopOutUser = function() {
    if (this.readyForRoombeat) {
      this.socket.emit('pop-out-user');
    } else {
      setTimeout(this.notifyPopOutUser, 500);
    }
  };

  this.forceDisconnect = function() {
    if (this.isPopOut) {
      window.self.close();
    } else {
      window.location.href = CONFIG['baseUrl'];
    }
  }.bind(this);


  /** Player **/
  this.hasVideo = function() {
    var videoData = this.player.getVideoData();
    return videoData['video_id'] !== null;
  };

  this.isPlayerPlaying = function() {
    return this._getPlayerState() == 'playing';
  };

  this.isPlayerPaused = function() {
    var videoId = this.player.getVideoData()['video_id'];
    return videoId !== null &&
        (this._getPlayerState() == 'paused' || this._getPlayerState() == 'not_started');
  };

  this.isPlayerEnded = function() {
    return this._getPlayerState() == 'ended';
  };

  this._getPlayerState = function() {
    var state = '';
    switch (this.player.getPlayerState()) {
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
  };

  /** Roombeat **/
  /**
   * Responds to roombeat if this socket is selected for roombeat :).
   * Will only respond if current video is ended for now.
   */
  this.listenToRoombeat = function() {
    setTimeout(function() {
      app.log('Ready to respond to Roombeat');
      this.readyForRoombeat = true;
    }.bind(this), 1000);
  }.bind(this);

  /**
   * Respond to roombeat.
   */
  this.respondRoombeat = function() {
    if (!this.readyForRoombeat) {
      setTimeout(this.respondRoombeat, 1000);
      return;
    }

    var playerEnded = this.isPlayerEnded();
    app.log('Responding to Roombeat | Player ended: ' + playerEnded);

    if (playerEnded) {
      var data = {
        videoId: this.player.getVideoData()['video_id'],
        isVideoEnded: true
      };
      this.roombeat.emit('roombeat', data);
    }
  }.bind(this);
}

var vChat = new vChatController();
