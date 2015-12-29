var UserSettings = React.createClass({
  componentDidMount: function() {
    this._$wrapper = $($(this.refs['wrapper'].getDOMNode())[0]);
    this._render();
    $(document).on('loginCheck', this._render);
  },

  _logout: function() {
    app.logout();
  },

  _updateSettings: function() {
    var data = {
      allowControl: this.refs['allowControl'].isSelected() ? 1 : 0,
      allowQueue: this.refs['allowQueue'].isSelected() ? 1 : 0
    };

    if (this.refs['userInfo'].isSelected()) {
      data['nickname'] = this.refs['nickname'].getVal();
    }

    app.post('usersettings', {
      data: data,
      success: function(user) {
        app.user = user;
        this._render();
        this.refs['infoBar'].alert('User Settings Updated');
      }.bind(this),
      error: function(response) {
        var errors = [];
        for (var i  = 0; i < response['response'].length; i++) {
          switch(response['response'][i]) {
            case 'invalid':
              errors.push('Invalid user info');
              break;
            case 'nickname':
              errors.push('Nickname exist');
              break;
          }
        }
        this._render();
        this.refs['alertBar'].alert(errors.join(' / '));
      }.bind(this)
    });
  },

  _changeUserInfo: function() {
    if (this.refs['userInfo'].isSelected()) {
      this.refs['nickname'].enableInput();
    } else {
      this.refs['nickname'].setVal(app.user['nickname']);
      this.refs['nickname'].disableInput();
    }
  },

  _render: function() {
    app.userLoggedIn(function(loggedIn) {
      if (loggedIn) {
        this._$wrapper.removeClass('hide');
        this.refs['nickname'].setVal(app.user['nickname']);
        if (app.user['settings']['allowControl'] == 1) {
          this.refs['allowControl'].select()
        } else {
          this.refs['allowControl'].unSelect()
        }
        if (app.user['settings']['allowQueue'] == 1) {
          this.refs['allowQueue'].select()
        } else {
          this.refs['allowQueue'].unSelect()
        }
      } else {
        this._$wrapper.addClass('hide');
      }
    }.bind(this));
  },

  render: function() {
    return (
      <div id="user-settings-wrapper" className="white-background card-item hide" ref="wrapper">
        <div className="center-text card-item-title">
          Welcome to vChat <span id="user-settings-welcome-nickname"></span>!
        </div>
        <Dialog id="user-settings-dialog" buttonText="Your vChat settings"
                noAutoFocus="true" header="User Settings">
                <AlertBar ref="alertBar" />
                <AlertBar alertType="info" ref="infoBar" />
                <InputField id="user-settings-nickname" label="Nickname" disabled="true"
                            required="true" ref="nickname" />
                <CheckBox id="user-settings-change-user-info"
                          selectedText="Change user information"
                          notSelectedText="Do not change user information"
                          onClickEvent={this._changeUserInfo}
                          ref="userInfo" />
                <CheckBox id="user-settings-allow-user-control"
                          selectedText="Users are allowed to control videos"
                          notSelectedText="Users are not allowed to control videos"
                          ref="allowControl" />
                <CheckBox id="user-settings-allow-user-queue"
                          selectedText="Users are allowed to queue videos"
                          notSelectedText="Users are not allowed to queue videos"
                          ref="allowQueue" />
                <Button id="user-settings-button" color="green" text="Update" onClick={this._updateSettings} />
        </Dialog>
        <Button id="logout" color="red" text="Logout" onClick={this._logout} />
      </div>
    );
  }
});

React.render(
  <UserSettings />,
  document.getElementById('comp-user-settings')
);
