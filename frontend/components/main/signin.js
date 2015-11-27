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
        app.user = data;
        this.refs['loginDialog'].closeDialog();
        app.showUserSettings();
      }.bind(this),
      error: function() {
        this._alertBar('login').alert('Invalid login information');
      }.bind(this)
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
        <Dialog id="login-dialog" buttonText="Login to vChat" header="Login" color="purple"
                ref="loginDialog">
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

React.render(
  <SignIn />,
  document.getElementById('comp-sign-in')
);