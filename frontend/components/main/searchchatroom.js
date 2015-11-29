var SearchChatRoom = React.createClass({
  componentWillMount: function() {
    this._roomType = '';
    this._room = '';
  },

  _alertBar: function() {
    return this.refs['alertBar'];
  },

  _searchPublicRoom: function() {
    var data = {
      name: this.refs['publicName'].getVal(),
      type: 'searchPublicRoom'
    };

    app.post('room', {
      data: data,
      success: function (data) {
        // Redirect user to room.
        this._roomType = data['type'];
        this._room = data['room'];
        this.refs['searchResult'].openDialog();
      }.bind(this),
      error: function(data) {
        if (!data['response']) {
          this._alertBar().alert('Room not found');
        }
      }.bind(this)
    });
  },

  _searchPrivateRoom: function() {
    var data = {
      name: this.refs['privateName'].getVal(),
      password: this.refs['privatePassword'].getVal(),
      type: 'searchPrivateRoom'
    };

    app.post('room', {
      data: data,
      success: function (data) {
        // Redirect user to room.
        this._roomType = data['type'];
        this._room = data['room'];
        this.refs['searchResult'].openDialog();
      }.bind(this),
      error: function(data) {
        if (data['status'] == 401) {
          this._alertBar().alert('Room name or password is incorrect');
        } else {
          if (!data['response']) {
            this._alertBar().alert('Room not found')
          }
        }
      }.bind(this)
    });
  },

  _entervChat: function() {
    window.location.href = CONFIG['vChatUrl'] + this._roomType + '/' + this._room;
  },

  _popOutVideoOnly: function() {
    app.popOutVideoOnly(this._roomType, this._room);
  },

  _popOutRegular: function() {
   app.popOutRegular(this._roomType, this._room);
  },

  _getTabs: function() {
    var tabs = [];
    tabs.push({
      id: 'search-public-room',
      text: 'Public',
      target: 'public-room-search-wrapper',
      selected: true
    });
    tabs.push({
      id: 'search-private-room',
      text: 'Private',
      target: 'private-room-search-wrapper'
    });

    return tabs;
  },

  render: function() {
    var tabs = this._getTabs();

    return (
      <div id="vchat-search-wrapper" className="white-background card-item form-item">
        <AlertBar ref="alertBar" />
        <div className="center-text card-item-title">Search/Enter vChats</div>
        <Tab tabs={tabs}>
          <div id="public-room-search-wrapper">
            <div>
              <InputField id="public-room-search-name" placeholder="Search by name" label="Room"
                          ref="publicName" />
            </div>
            <Button id="public-room-search" color="purple" text="Search public vChat"
                     onClick={this._searchPublicRoom} />
          </div>
          <div id="private-room-search-wrapper">
            <div className="form-item">
              <InputField id="private-room-search-name" placeholder="Enter by name" label="Room"
                           ref="privateName" />
              <InputField id="private-room-search-password" placeholder="Private room's password"
                          label="Password" maxLength="16" ref="privatePassword" />
              <Button id="private-room-search" color="purple" text="Search private vChat"
                      onClick={this._searchPrivateRoom} />
            </div>
          </div>
        </Tab>
        <Dialog id="search-result-dialog" header="Enter the vChat Room" ref="searchResult"
                noButton="true">
          <Button id="enter-vchat" color="purple" text="Enter vChat room"
                  onClick={this._entervChat} />
          <Button id="open-pop-out" color="purple" text="Open Pop Out (video only)"
                  onClick={this._popOutVideoOnly} />
          <Button id="open-pop-out" color="purple" text="Open Pop Out (no control & no chat)"
                  onClick={this._popOutRegular} />
        </Dialog>
      </div>
    );
  }
});

React.render(
  <SearchChatRoom />,
  document.getElementById('comp-vchat-search')
);
