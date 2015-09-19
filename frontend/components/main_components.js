var NewChatRoomType = React.createClass({
  $el: function(str) {
    return $(this.refs[str].getDOMNode());
  },
  onClick: function() {
    var $roomType = this.$el('roomType');
    var $passwordWrapper = this.$el('passwordWrapper');
    var $password = this.$el('password');
    var $passwordVerify = this.$el('passwordVerify');
    if ($roomType.attr('data-value') == 'public') {
      $roomType.text('Private Room');
      $roomType.attr('data-value', 'private');
      $passwordWrapper.removeClass('hide');
      $password.val('');
      $passwordVerify.val('');
    } else {
      $roomType.text('Public Room');
      $roomType.attr('data-value', 'public');
      $passwordWrapper.addClass('hide');
    }
  },

  render: function() {
    return (
      <div id="new-chat-room-wrapper">
        <div id="new-chat-room-type" className="clickable form-item create-new-public-room"
             data-value="public" onClick={this.onClick}
             ref="roomType">Public Room
        </div>
        <div id="create-new-chat-room-password-wrapper" className="hide"
             ref="passwordWrapper">
          <div className="form-item">Password (Required for a private room)</div>
          <input id="new-chat-room-password" className="form-item" type="password" maxLength="16"
                 ref="password"/>
          <div className="form-item">Check Password</div>
          <input id="new-chat-room-password-verify" className="form-item" type="password"
                   maxLength="16" ref="passwordVerify"/>
        </div>
      </div>
    );
  }
});


React.render(
  <NewChatRoomType />,
  document.getElementById('comp-new-chat-room-type')
);

