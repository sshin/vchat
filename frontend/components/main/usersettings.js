var UserSettings = React.createClass({
  componentDidMount: function() {
    this._$wrapper = $($(this.refs['wrapper'].getDOMNode())[0]);
    this._render();
    $(document).on('loginCheck', this._render);
  },

  _logout: function() {
    app.logout();
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

  render: function() {
    return (
      <div id="user-settings-wrapper" className="white-background card-item hide" ref="wrapper">
        <div className="center-text card-item-title">
          Welcome to vChat <span id="user-settings-welcome-nickname"></span>!
        </div>
        <Dialog id="user-settings-dialog" buttonText="Your vChat settings"
                header="User Settings">
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
