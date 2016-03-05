var UserStickers = React.createClass({
  componentWillMount: function() {
    this._stickers = null;
    $(document).on('loginCheck', this._render);
  },

  componentDidMount: function() {
    this._$wrapper = $($(this.refs['wrapper'].getDOMNode())[0]);
    this._render();
  },

  _render: function() {
    app.userLoggedIn(function(loggedIn) {
      if (loggedIn) {
        this._$wrapper.removeClass('hide');
      } else {
        this._$wrapper.addClass('hide');
      }
    }.bind(this));
  },

  _viewList: function () {
    this.refs['stickersDialog'].openDialog();
    if (this._stickers === null) {
      app.get('userstickers', {
        success: function(data) {
          this._stickers = data;
          this._renderVideoList();
        }.bind(this)
      });
    } else {
      this._renderVideoList();
    }
  },

  _renderVideoList: function() {
    var $el = $($(this.refs['stickersList'].getDOMNode())[0]);
    $el.empty();

    if (this._stickers.length == 0) {
      $el.append('<div class="error-text full-width center-text">'
                   + 'You have no stickers' +
                 '</div>');
    } else {
      for (var i = this._stickers.length - 1; i >= 0; i--) {
        $el.append(this._renderItem(this._stickers[i]));
      }
    }

    this._addOnClickAction();
  },

  _renderItem: function(item) {
    return '<div class="stickers-list-item">' +
               this._buildStickers(item) +
            '</div>';
  },

  _buildStickers: function(item) {
    var html = '';
    for (var i = 0; i < parseInt(item['num']); i++) {
      html += '<span class="sticker-image-wrapper" data-name="' + item['name'] + '" data-num="' + (i+1) + '">' +
                 '<img class="sticker-image" src="'
                      + this._buildStickerUrl(item['name'], i+1) + '">' +
               '</span>';
    }
    return html;
  },

  _buildStickerUrl: function(name, num) {
    return '/assets/stickers/' + name + '/' + num + '.jpg';
  },

  _addOnClickAction: function() {
    // Reset event handler and add new one...lame.
    var $Dialog = this.refs['stickersDialog'];
    $('.sticker-image-wrapper').off().on('click', function() {
      var data = {
        type: 'sticker',
        username: $('#user-name').val(),
        stickerName: $(this).attr('data-name'),
        stickerNum: $(this).attr('data-num')
      };

      socket.emit('client-chat-send', data);
      $Dialog.closeDialog();
    });
  },

  render: function() {
    return (
      <div id="user-stickers-wrapper" className="hide" ref="wrapper">
        <Button id="view-stickers-list" text="Stickers"
                color="green" onClick={this._viewList} />
        <Dialog id="user-stickers-dialog" header="Stickers" ref="stickersDialog"
                noButton="true">
          <div id="user-stickers-inner-wrapper" ref="stickersList"></div>
        </Dialog>
      </div>
    );
  }
});

React.render(
  <UserStickers />,
  document.getElementById('comp-user-stickers')
);
