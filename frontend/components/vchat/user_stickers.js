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
      var selectHtml = '<select id="stickers-select">';
      for (var i = 0; i < this._stickers.length; i++) {
        var currSticker = this._stickers[i];
        selectHtml += '<option value="' + currSticker['name'] + '">' + currSticker['display_name'] + '</option>';
        $el.append(this._renderItem(currSticker, i !== 0));
      }
      selectHtml += '</select>';
      $el.prepend(selectHtml);
    }

    this._addAction();
  },

  _renderItem: function(item, hide) {
    var className = 'stickers-list-item';
    if (hide) className += ' hide';

    return '<div class="' + className + '" data-name="' + item['name'] + '">' +
               this._buildStickers(item) +
            '</div>';
  },

  _buildStickers: function(item) {
    var html = '';
    for (var i = 0; i < parseInt(item['num']); i++) {
      html += '<span class="sticker-image-wrapper" data-name="' + item['name'] + '" data-num="' + (i+1) + '" data-extension="' + item['extension'] + '">' +
                 '<img class="sticker-image" src="'
                      + this._buildStickerUrl(item['name'], i+1, item['extension']) + '">' +
               '</span>';
    }
    return html;
  },

  _buildStickerUrl: function(name, num, extension) {
    return '/assets/stickers/' + name + '/' + num + '.' + extension;
  },

  _addAction: function() {
    // Reset event handler and add new one...lame.
    var $Dialog = this.refs['stickersDialog'];
    $('.sticker-image-wrapper').off().on('click', function() {
      var data = {
        type: 'sticker',
        username: $('#user-name').val(),
        stickerName: $(this).attr('data-name'),
        stickerNum: $(this).attr('data-num'),
        extension: $(this).attr('data-extension')
      };

      vChat.socket.emit('client-chat-send', data);
      $Dialog.closeDialog();
    });

    $('#stickers-select').off().on('change', function() {
      var value = $(this).val();
      $('.stickers-list-item').each(function() {
        if ($(this).attr('data-name') === value) {
          $(this).removeClass('hide');
        } else {
          $(this).addClass('hide');
        }
      });
    });
  },

  render: function() {
    return (
      <div id="user-stickers-wrapper" className="hide" ref="wrapper">
        <Button id="view-stickers-list" text="Stickers"
                color="green" onClick={this._viewList} />
        <Dialog id="user-stickers-dialog" header="Stickers" ref="stickersDialog"
                noButton="true">
          <div id="user-stickers-inner-wrapper" className="full-width" ref="stickersList"></div>
        </Dialog>
      </div>
    );
  }
});

React.render(
  <UserStickers />,
  document.getElementById('comp-user-stickers')
);
