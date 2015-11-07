$(document).ready(function () {
  _setCategories();
  //_setRandomPublicRooms();
  _getRoomCounts();
});

function _setCategories() {
  app.get('category', {
    success: function(data) {
      var categories = data['categories'];
      var $create = $('#new-chat-room-category');

      for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        $create.append('<option value="' + category['type'] + '">' + category['name'] + '</option>');
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

function _getRoomCounts() {
  app.get('room', {
    data: {get: 'counts'},
    success: function(data) {
      var total = parseInt(data['public']) + parseInt(data['private']);
      $('#total-count').text(total);
      $('#public-count').text(data['public']);
      $('#private-count').text(data['private']);
    }
  });
}