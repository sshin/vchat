var VideoSearch = React.createClass({
  componentWillMount: function() {
    this._resetSearch();
  },

  _resetSearch: function() {
    this._keyword = '';
    this._nextPageToken = '';
    this._index = -1;
    this._searchResults = [];
  },

  // Trigger search on enter.
  componentDidMount: function() {
    var $InputField = this.refs['videoSearch'];
    var $el = $($(this.refs['videoSearch'].getDOMNode())[0]);
    $el.on('keypress', function(e) {
      if (e.keyCode == 13) {
        var input = $InputField.getVal();

        // Don't continue on blank input or key word is less than 3 chars.
        if (input === '' || input.length < 3) return;
        // TODO: error message for input.

        var data = {
          key: 'AIzaSyAlUxS-otlTs8LjXPtbICBbAGTvNKY7wSY',
          part: 'snippet',
          q: input,
          type: 'video',
          maxResults: 20 // Videos per page.
        };

        var resetSearch = true;
        if (this._keyword === input) {
          // Search more.
          data['pageToken'] = this._nextPageToken;
          resetSearch = false;
        } else if (this._keyword === '') {
          resetSearch = false;
        }

        $.ajax({
          url: 'https://www.googleapis.com/youtube/v3/search',
          data: data,
          beforeSend: $InputField.disableInput(),
          success: function(response) {
            this._keyword = input;
            this._nextPageToken = response.nextPageToken;
            this._searchResults.push(response.items);
            this._index++;
            this._renderSearchResult(resetSearch);
          }.bind(this),
          error: function(response) {
            app.error('Youtube video search error.');
            $InputField.enableInput();
          }
        })
      }
    }.bind(this));
  },

  _renderSearchResult: function(resetSearch) {
    var title, videoId, thumbnail;
    var items = this._searchResults[this._index];
    var $el = $($(this.refs['searchResult'].getDOMNode())[0]);
    $el.empty();

    if (resetSearch) this._resetSearch();
    for(var i = 0; i < items.length; i++) {
      title = items[i].snippet.title;
      videoId = items[i].id.videoId;
      thumbnail = items[i].snippet.thumbnails.high.url;
      $el.append(this._searchResultItem(title, videoId, thumbnail));
    }
    // Enable input back.
    this.refs['videoSearch'].enableInput();
    this._addOnClickAction();
  },

  _searchResultItem: function(title, videoId, thumbnail) {
    return '<div class="video-search-result-item" data-videoId="' + videoId + '">' +
               '<div class="video-search-result-title">' + title + '</div>' +
               '<div class="video-search-result-thumbnail">' +
                 '<img class="video-search-result-thumbnail-image" src="' + thumbnail + '">' +
               '</div>' +
            '</div>';
  },

  _addOnClickAction: function() {
    // Reset event handler and add new one...lame.
    var $Dialog = this.refs['dialog'];
    $('.video-search-result-item').off().on('click', function() {
      var data = {
        username: $('#user-name').val(),
        videoId: $(this).attr('data-videoId')
      };

      socket.emit('new-video-submit', data);
      $Dialog.closeDialog();
    });
  },

  render: function() {
    return (
      <div id="video-search-wrapper">
        <Dialog id="video-search-dialog" buttonText="Search YouTube videos"
                header="Search YouTube videos" ref="dialog">
          <InputField id="video-search" label="Search" maxLength="64"
                          placeholder="Search by name" ref="videoSearch"></InputField>
          <div id="video-search-result" ref="searchResult"></div>
        </Dialog>
      </div>
    );
  }
});


/** Renderers **/
React.render(
  <VideoSearch />,
  document.getElementById('comp-video-search')
);

