$(document).ready(function () {
  _setCategories();
  //_setTodaysMostLikedRooms();
  //_setRandomPublicRooms();
});

function _setCategories() {
  app.get('category', {
    success: function (data) {
      var categories = data['categories'];
      var $create = $('#new-chat-room-category');

      for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        $create.append('<option value="' + category['type'] + '">' + category['name'] + '</option>');
      }
    }
  });
}

function _setTodaysMostLikedRooms() {
  app.get('room', {
    data: {get: 'mostlikedrooms'},
    success: function (rooms) {
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
    success: function (rooms) {
      console.log(rooms);
    }
  });
}
