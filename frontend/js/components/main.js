var CreateNewChatRoom = React.createClass({displayName: "CreateNewChatRoom",
  render: function() {
    var createButtonData = {
      id: 'private-room-create',
      onClick: function (e) {
        var prefix = '#new-chat-room-';
        var data = {
          category: $(prefix + 'category').val(),
          name: $(prefix + 'name').val(),
          type: $(prefix + 'type').attr('data-value'),
          password: $(prefix + 'password').val(),
          verifyPassword: $(prefix + 'password-verify').val(),
          type: 'create'
        }

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
      text: 'Create new vChat room!',
      color: 'blue'
    };

    return (
      React.createElement("div", {id: "create-new-chat-room-wrapper", className: "white-background card-item"}, 
        React.createElement("div", {id: "create-new-chat-room-form"}, 
          React.createElement("div", null, 
            React.createElement("label", {htmlFor: "new-chat-room-category", className: "form-item"}, "Category (required)"), 
            React.createElement("div", null, 
              React.createElement("select", {id: "new-chat-room-category"}, 
                React.createElement("option", {value: "none"}, "Select a category")
              )
            )
          ), 
          React.createElement("div", null, 
            React.createElement("label", {htmlFor: "new-chat-room-name", className: "form-item"}, "Name"), 
            React.createElement("input", {id: "new-chat-room-name", maxLength: "64"})
          ), 
          React.createElement("div", {id: "comp-new-chat-room-type"})
        ), 
        React.createElement(Button, {data: createButtonData})
      )
    );
  }
});

var NewChatRoomType = React.createClass({displayName: "NewChatRoomType",
  render: function() {
    return (
      React.createElement("div", {id: "new-chat-room-wrapper"}, 
        React.createElement("div", {id: "comp-new-chat-room-type-button"}), 
        React.createElement("div", {id: "create-new-chat-room-password-wrapper", className: "hide"}, 
          React.createElement("label", {htmlFor: "new-chat-room-password", className: "form-item"}, "Password (Required for a private room)"), 
          React.createElement("input", {id: "new-chat-room-password", type: "password", maxLength: "16", 
                 ref: "password"}), 
          React.createElement("label", {htmlFor: "new-chat-room-password-verify", className: "form-item"}, "Check Password"), 
          React.createElement("input", {id: "new-chat-room-password-verify", type: "password", 
                   maxLength: "16", ref: "passwordVerify"})
        )
      )
    );
  }
});


/** Renderers **/
React.render(
  React.createElement(CreateNewChatRoom, null),
  document.getElementById('comp-create-new-chat-room')
);

React.render(
  React.createElement(NewChatRoomType, null),
  document.getElementById('comp-new-chat-room-type')
);

React.render(
  React.createElement(Button, {data: {id: 'new-chat-room-type',
                onClick: function(e) {
                  var $roomType = $(e.target);
                  var $passwordWrapper = $('#create-new-chat-room-password-wrapper');
                  var $password = $('#new-chat-room-password');
                  var $passwordVerify = $('#new-chat-room-password-verify');
                  if ($roomType.attr('data-value') == 'public') {
                    $roomType.text('Private Room');
                    $roomType.attr('data-value', 'private');
                    $roomType.addClass('red-btn');
                    $roomType.removeClass('green-btn');
                    $passwordWrapper.removeClass('hide');
                    $password.val('');
                    $passwordVerify.val('');
                  } else {
                    $roomType.text('Public Room');
                    $roomType.attr('data-value', 'public');
                    $roomType.removeClass('red-btn');
                    $roomType.addClass('green-btn');
                    $passwordWrapper.addClass('hide');
                  }
                },
                text: 'Public Room',
                color: 'green',
                dataValue: 'public'}}),
  document.getElementById('comp-new-chat-room-type-button')
)

