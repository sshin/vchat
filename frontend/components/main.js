var SearchChatRoom = React.createClass({
  _searchPublicRoom: function() {
    var data = {
      name: this.refs['publicName'].getVal(),
      type: 'searchPublicRoom'
    }

    app.post('room', {
      data: data,
      success: function (data) {
        // TODO: Instead of redirecting user to the room right away,
        // we should list all rooms that contains the search keyword.
        console.log(data);
      }
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
        console.log('redirecting to ' + data['url']);
        setTimeout(function () {
          window.location.href = data['url'];
        }, 1000);
      }
    });
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
              <Button id="private-room-search" color="purple" text="Enter private vChat"
                      onClick={this._searchPrivateRoom} />
            </div>
          </div>
        </Tab>
      </div>
    );
  }
});

var CreateNewChatRoom = React.createClass({
  _createRoom: function() {
    var prefix = '#new-chat-room-';
    var data = {
      category: $(prefix + 'category').val(),
      name: $(prefix + 'name').val(),
      roomType: $(prefix + 'type').attr('data-value'),
      password: $(prefix + 'password').val(),
      verifyPassword: $(prefix + 'password-verify').val(),
      type: 'create'
    };

    app.post('room', {
      data: data,
      success: function(data) {
        console.log('redirecting to ' + data['url']);
        setTimeout(function () {
          window.location.href = data['url'];
        }, 1000);
      },
      error: function(data) {
        var errors = data.errors;

        for(var i = 0; i < errors.length; i++) {
          switch(errors[i]) {
            case 'category':
              break;
            case 'name':
              break;
            case 'password':
              break;
          }
        }
      }
    });
  },

  render: function() {
    return (
      <div id="create-new-chat-room-wrapper" className="white-background card-item">
        <Dialog id="create-new-chat-room-dialog" buttonText="Create new vChat!"
                header="Create new vChat!">
          <div id="create-new-chat-room-form" ref="createForm">
            <div>
              <label htmlFor="new-chat-room-category" className="form-item">Category (required)</label>
              <div className="form-item">
                <select id="new-chat-room-category">
                  <option value="none">Select a category</option>
                </select>
              </div>
            </div>
            <div>
              <InputField id="new-chat-room-name" label="Name" maxLength="64"
                          placeholder="Name for your new vChat room" />
            </div>
            <div id="comp-new-chat-room-type"></div>
            <Button id="private-room-create" text="Create"
                    color="blue" onClick={this._createRoom} />
          </div>
        </Dialog>
      </div>
    );
  }
});

var NewChatRoomType = React.createClass({
  _changeType: function(e) {
    var $roomType = $(e.target);
    var $passwordWrapper = $(this.refs['passwordWrapper'].getDOMNode());
    var $password = this.refs['password'].getInputElement();
    var $passwordVerify = this.refs['passwordVerify'].getInputElement();
    if ($roomType.attr('data-value') == 'public') {
      $roomType.text('Private Room');
      $roomType.attr('data-value', 'private');
      $roomType.addClass('orange-btn');
      $roomType.removeClass('green-btn');
      $passwordWrapper.removeClass('hide');
      $password.val('');
      $passwordVerify.val('');
    } else {
      $roomType.text('Public Room');
      $roomType.attr('data-value', 'public');
      $roomType.removeClass('orange-btn');
      $roomType.addClass('green-btn');
      $passwordWrapper.addClass('hide');
    }
  },

  render: function() {
    return (
      <div id="new-chat-room-wrapper">
        <Button id="new-chat-room-type" onClick={this._changeType} text="Public Room"
                color="green" dataValue="public" />
        <div id="create-new-chat-room-password-wrapper" className="hide" ref="passwordWrapper">
          <InputField id="new-chat-room-password" maxLength="16" label="Password"
                      placeholder="Password for private vChat room" type="password"
                      ref="password" />
          <InputField id="new-chat-room-password-verify" maxLength="16" label="Check Password"
                      placeholder="Verify your password" type="password"
                      ref="passwordVerify" />
        </div>
      </div>
    );
  }
});


/** Renderers **/
React.render(
  <SearchChatRoom />,
  document.getElementById('comp-vchat-search')
);

React.render(
  <CreateNewChatRoom />,
  document.getElementById('comp-create-new-chat-room')
);

React.render(
  <NewChatRoomType />,
  document.getElementById('comp-new-chat-room-type')
);