var SignIn = React.createClass({
  _alertBar: function(func) {
    return this.refs[func + 'AlertBar'];
  },

  _login: function() {
    var data = {
      username: this.refs['loginUsername'].getVal(),
      password: this.refs['loginPassword'].getVal()
    };

    app.post('login', {
      data: data,
      success: function(data) {
        console.log('login success!');
      },
      error: function() {
        console.log('login error!');
      }
    })
  },

  _signUp: function() {
    var data = {
      username: this.refs['signupUsername'].getVal(),
      password: this.refs['signupPassword'].getVal(),
      passwordVerify: this.refs['signupPasswordVerify'].getVal(),
      email: this.refs['signupEmail'].getVal()
    };

    app.post('signup', {
      data: data,
      success: function(data) {
        console.log(data);
      },
      error: function(data) {
        var errors = data.response.errors;
        var message = [];
        for (var i = 0; i < errors.length; i++) {
          switch(errors[i]) {
            case 'username':
              this.refs['signupUsername'].highlight();
              message.push('Username');
              break;
            case 'password':
              this.refs['signupPassword'].highlight();
              this.refs['signupPasswordVerify'].highlight();
              message.push('Password');
              break;
            case 'email':
              this.refs['signupEmail'].highlight();
              message.push('Email');
              break;
          }
        }
        message = message.join(' / ');
        this._alertBar('signup').alert(message);
      }.bind(this)
    });
  },

  render: function() {
    return (
      <div id="login-wrapper" className="white-background card-item">
        <Dialog id="login-dialog" buttonText="Login to vChat" header="Login" color="purple">
          <div id="login-form-wrapper" ref="loginForm">
            <AlertBar ref="loginAlertBar" />
            <div id="login-form">
              <div>
                <InputField id="username-input" placeholder="Your username" label="Username"
                            ref="loginUsername" required="true" />
                <InputField id="password-input" placeholder="Your password" label="Password"
                            ref="loginPassword" type="password" required="true" />
              </div>
              <Button id="login" color="purple" text="Login to vChat"
                       onClick={this._login} />
            </div>
          </div>
        </Dialog>
        <Dialog id="signup-dialog" buttonText="Don't have an account yet?" header="Sign Up">
          <div id="signup-form-wrapper" ref="signupForm">
            <AlertBar ref="signupAlertBar" />
            <div id="signup-form">
              <div>
                <InputField id="username-input" placeholder="Your username"
                            label="Username" ref="signupUsername" required="true" />
                <InputField id="password-input" placeholder="Your password"
                            label="Password" ref="signupPassword" type="password"required="true"  />
                <InputField id="password-verify-input" placeholder="Verify your password"
                            label="Verify Password" ref="signupPasswordVerify" type="password"
                            required="true" />
                <InputField id="email-input" placeholder="Your email"
                            label="Email" ref="signupEmail" required="true" />
              </div>
              <Button id="login" color="blue" text="Sign up to vChat"
                       onClick={this._signUp} />
            </div>
          </div>
        </Dialog>
      </div>
    );
  }
});

var SearchChatRoom = React.createClass({
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
        window.location.href = data['url'];
      },
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
        window.location.href = data['url'];
      }, error: function(data) {
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
            <Button id="public-room-search" color="purple" text="Enter public vChat"
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
  _alertBar: function() {
    return this.refs['alertBar'];
  },

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
        var errors = data.response.errors;

        var message = [];
        for(var i = 0; i < errors.length; i++) {
          switch(errors[i]) {
            case 'category':
              $(this.refs['category'].getDOMNode()).addClass('red-border');
              message.push('Category');
              break;
            case 'name':
            case 'name exist':
              this.refs['name'].highlight();
              message.push('Name');
              break;
            case 'password':
              this.refs['password'].highlight();
              this.refs['passwordVerify'].highlight();
              message.push('Password');
              break;
          }
        }
        message = message.join(' / ');
        this._alertBar().alert(message);
      }.bind(this)
    });
  },

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
      <div id="create-new-chat-room-wrapper" className="white-background card-item">
        <Dialog id="create-new-chat-room-dialog" buttonText="Create new vChat!"
                header="Create new vChat!">
          <AlertBar alertType="alert" ref="alertBar" />
          <div id="create-new-chat-room-form" ref="createForm">
            <div>
              <label htmlFor="new-chat-room-category" className="form-item">
                Category <span className="required-asterisk">*</span>
              </label>
              <div className="form-item">
                <select id="new-chat-room-category" ref="category">
                  <option value="none">Select a category</option>
                </select>
              </div>
            </div>
            <div>
              <InputField id="new-chat-room-name" label="Name" maxLength="64"
                          placeholder="Name for your new vChat room" ref="name" required="true" />
            </div>
            <div id="new-chat-room-wrapper">
              <Button id="new-chat-room-type" onClick={this._changeType} text="Public Room"
                      color="green" dataValue="public" />
              <div id="create-new-chat-room-password-wrapper" className="hide" ref="passwordWrapper">
                <InputField id="new-chat-room-password" maxLength="16" label="Password"
                            placeholder="Password for private vChat room" type="password"
                            ref="password" required="true" />
                <InputField id="new-chat-room-password-verify" maxLength="16" label="Check Password"
                            placeholder="Verify your password" type="password"
                            ref="passwordVerify" required="true" />
              </div>
            </div>
            <Button id="private-room-create" text="Create"
                    color="blue" onClick={this._createRoom} />
          </div>
        </Dialog>
      </div>
    );
  }
});


/** Renderers **/
React.render(
  <SignIn />,
  document.getElementById('comp-sign-in')
);

React.render(
  <SearchChatRoom />,
  document.getElementById('comp-vchat-search')
);

React.render(
  <CreateNewChatRoom />,
  document.getElementById('comp-create-new-chat-room')
);

