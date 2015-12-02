var UserVideoList = React.createClass({
  componentWillMount: function() {
    this._videoList = null;
  },

  _addToList: function () {
    var data = player.getVideoData()
    app.post('uservideolist', {
      data: data,
      success: function() {
        if (this._videoList !== null) {
          var formattedData = {
            videoId: data['video_id'],
            title: data['title'],
            author: data['author']
          };
          this._videoList.push(formattedData);
        }
        this._displayAddToListResult('success', formattedData);
      }.bind(this),
      error: function(data) {
        this._displayAddToListResult(data['response']['reason'], {});
      }.bind(this)
    });
  },

  _displayAddToListResult(result, videoData) {
    var dialog =  this.refs['addVideoResultDialog'];
    var $text = $($(this.refs['addVideoResult'].getDOMNode())[0]);
    $text.empty();

    switch(result) {
      case 'success':
        $text.append('<div class="success-text full-width center-text">'
                      + 'Video successfully added to your memorized list!' +
                     '</div>');
        $text.append(this._renderItem(videoData));
        break;
      case 'exist':
        $text.append('<div class="error-text full-width center-text">'
                      + 'Current video is already on your memorized list' +
                     '</div>');
        break;
      case 'full':
        $text.append('<div class="error-text full-width center-text">'
                      + 'Your memorized video list is full' +
                     '</div>');
        break;
    }

    dialog.openDialog();
  },

  _viewList: function () {
    this.refs['videoListDialog'].openDialog();
    if (this._videoList === null) {
      app.get('uservideolist', {
        success: function(data) {
          this._videoList = data;
          this._renderVideoList();
        }.bind(this)
      });
    } else {
      this._renderVideoList();
    }
  },

  _renderVideoList: function() {
    var $el = $($(this.refs['videoList'].getDOMNode())[0]);
    $el.empty();

    if (this._videoList.length == 0) {
      $el.append('<div class="error-text full-width center-text">'
                   + 'You have no videos on your list' +
                 '</div>');
    } else {
      // videoList is sorted in ascending order, but we want to display the new one first.
      // So iterate from tail to head.
      for (var i = this._videoList.length - 1; i >= 0; i--) {
        $el.append(this._renderItem(this._videoList[i]));
      }
    }

    this._addOnClickAction();
  },

  _renderItem: function(item) {
    return '<div class="video-list-item" data-videoId="' + item['videoId'] + '">' +
               '<div class="video-list-title">' + item['title'] + '</div>' +
               '<div class="video-list-thumbnail">' +
                 '<img class="video-list-thumbnail-image" src="'
                      + this._buildThumbnailUrl(item['videoId']) + '">' +
               '</div>' +
            '</div>';
  },

  _buildThumbnailUrl: function(videoId) {
    return 'http://img.youtube.com/vi/' + videoId + '/hqdefault.jpg'
  },

  _addOnClickAction: function() {
    // Reset event handler and add new one...lame.
    var $Dialog = this.refs['videoListDialog'];
    $('.video-list-item').off().on('click', function() {
      var data = {
        username: $('#user-name').val(),
        videoId: $(this).attr('data-videoId'),
        submitType: 'list'
      };

      socket.emit('new-video-submit', data);
      $Dialog.closeDialog();
    });
  },

  render: function() {
    return (
      <div id="user-video-list-wrapper">
        <Button id="add-video-to-list" text="Add current video to your memorized video list"
                color="green" onClick={this._addToList} />
        <Button id="view-video-list" text="View your memorized video list"
                color="green" onClick={this._viewList} />
        <Dialog id="video-list-dialog" header="Memorized Video List" ref="videoListDialog"
                noButton="true">
          <div id="video-list-inner-wrapper" ref="videoList"></div>
        </Dialog>
        <Dialog id="add-video-result" header="Add Video to List"
                ref="addVideoResultDialog" noButton="true">
          <div id="add-video-result-inner-wrapper" className="full-width">
            <div id="add-video-result-text" ref="addVideoResult"></div>
          </div>
        </Dialog>
      </div>
    );
  }
});

React.render(
  <UserVideoList />,
  document.getElementById('comp-user-video-list')
);
