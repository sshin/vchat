$(document).ready(function() {
    _setCategories();
    //_setTodaysMostLikedRooms();
    //_setRandomPublicRooms();
    $('#private-room-create').on('click', _createChatRoom);
    $('#private-room-search').on('click', _searchPrivateChatRoom);
    $('#public-room-search').on('click', _searchPublicChatRoom);
    $('#new-chat-room-type').on('click', _changeType);
});

function _setCategories() {
    app.get('category', {
        success: function(data) {
            var categories = data['categories'];
            var $create = $('#new-chat-room-category');

            for (var i = 0; i < categories.length; i++) {
                var category = categories[i];
                $create.append('<option value="' + category['type']  + '">' + category['name']  + '</option>');
            }
        }
    });
}

function _setTodaysMostLikedRooms() {
    app.get('room', {
        data: {get: 'mostlikedrooms'},
        success: function(rooms) {
            var $el = $('#todays-most-liked-chat-rooms');
            for (var i = 0; i < rooms.length; i++) {
                var room = JSON.parse(rooms[i]);
                var category = $('#public-room-search-category option[value="' + room['category'] + '"]').text();
                $el.append('<div>(' + category + ') ' + room['name'] + ' liked ' + room['likes'] + ', current users in this room: ' + room['userCount'] + '</div>');
            }
        }
    });
}

function _setRandomPublicRooms() {
    app.get('room', {
        data: {get: 'randomRooms'},
        success: function(rooms) {
            console.log(rooms);
        }
    });
}

function _createChatRoom() {
    var prefix = '#new-chat-room-';
    var data = {
        category: $(prefix+'category').val(),
        name: $(prefix+'name').val(),
        type: $(prefix+'type').attr('data-value'),
        password: $(prefix+'password').val(),
        verifyPassword: $(prefix+'password-verify').val(),
        type: 'create'
    }

    app.post('room', {
        data: data,
        success: function(data) {
            console.log('redirecting to ' + data['url']);
            setTimeout(function () {
                window.location.href = data['url'];
            }, 1000);
        }
    });
}

function _searchPrivateChatRoom() {
    var data = {
        name: $('#private-room-search-name').val(),
        password: $('#private-room-search-password').val(),
        type: 'searchPrivateRoom'
    }

    app.post('room', {
        data: data,
        success: function(data) {
            // TODO: Instead of having input fields on page, there should be a button that opens up
            // a dialog which contains input fields. We should automatically redirect user to the
            // private room if name and password matches.
            console.log('redirecting to ' + data['url']);
            setTimeout(function() {
                window.location.href = data['url'];
            }, 1000);
        }
    });
}

function _searchPublicChatRoom() {
    var data = {
        name: $('#public-room-search-name').val(),
        type: 'searchPublicRoom'
    }

    app.post('room', {
        data: data,
        success: function(data) {
            // TODO:  Button and dialog same as private room search.
            // However, instead of redirecting user to the room right away,
            // we should list all rooms that contains the search keyword.
            console.log(data);
        }
    });
}

function _changeType() {
    var $el = $('#new-chat-room-type');
    var $password = $('#create-new-chat-room-password-wrapper');

    if ($el.attr('data-value') == 'public') {
        $el.text('Private Room');
        $el.attr('data-value', 'private');
        $password.removeClass('hide');
        $('#new-chat-room-password').val('');
        $('#new-chat-room-password-verify').val('');
    } else {
        $el.text('Public Room');
        $el.attr('data-value', 'public');
        $password.addClass('hide');
    }
}

