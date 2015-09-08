$(document).ready(function() {
    _setCategories();
    _setTodaysMostLikedRooms();
//     _setRandomPublicRooms();
    $('#private-room-create').on('click', _createChatRoom);
    $('#new-chat-room-type').on('click', _changeType);
});

function _setCategories() {
    app.get('category', {
        success: function(categories) {
            var $search = $('#public-room-search-category');
            var $create = $('#new-chat-room-category');

            for (var i = 0; i < categories.length; i++) {
                var category = categories[i];
                $search.append('<option value="' + category['type']  + '">' + category['name']  + '</option>');
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
        data: {get: 'randomrooms'},
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
        verifyPassword: $(prefix+'password-verify').val()
    }

    app.post('room', {
        success: function(response) {
            console.log(response);
        },
        error: function(response) {
            console.log(response);
        },
        data: data
    });

}

function _changeType() {
    var $el = $('#new-chat-room-type');

    if ($el.attr('data-value') == 'public') {
        $el.text('Private Room');
        $el.attr('data-value', 'private');
    } else {
        $el.text('Public Room');
        $el.attr('data-value', 'public');
    }
}

