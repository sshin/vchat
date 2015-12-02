var UserSettings = React.createClass({
  _logout: function() {
    app.post('logout', {
      success: app.userNotLoggedIn
    });
  },

  render: function() {
    return (
      <div id="user-settings-wrapper" className="white-background card-item">
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
