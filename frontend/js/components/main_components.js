var NewChatRoomType = React.createClass({displayName: "NewChatRoomType",
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
      React.createElement("div", {id: "new-chat-room-wrapper"}, 
        React.createElement("div", {id: "new-chat-room-type", className: "clickable form-item create-new-public-room", 
             "data-value": "public", onClick: this.onClick, 
             ref: "roomType"}, "Public Room"
        ), 
        React.createElement("div", {id: "create-new-chat-room-password-wrapper", className: "hide", 
             ref: "passwordWrapper"}, 
          React.createElement("div", {className: "form-item"}, "Password (Required for a private room)"), 
          React.createElement("input", {id: "new-chat-room-password", className: "form-item", type: "password", maxLength: "16", 
                 ref: "password"}), 
          React.createElement("div", {className: "form-item"}, "Check Password"), 
          React.createElement("input", {id: "new-chat-room-password-verify", className: "form-item", type: "password", 
                   maxLength: "16", ref: "passwordVerify"})
        )
      )
    );
  }
});


React.render(
  React.createElement(NewChatRoomType, null),
  document.getElementById('comp-new-chat-room-type')
);

