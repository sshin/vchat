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
          window.location.href = data['url'] + '?newroom=1';
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

React.render(
  <CreateNewChatRoom />,
  document.getElementById('comp-create-new-chat-room')
);
