var VideoPopOut = React.createClass({
   _popOutVideoOnly: function() {
    app.popOutVideoOnly(roomInfo['type'], roomInfo['name']);
  },

  _popOutRegular: function() {
    app.popOutRegular(roomInfo['type'], roomInfo['name']);
  },

  render: function() {
    return (
      <div id="video-pop-out-wrapper">
        <Button id="pop-out-video-only" text="Video Pop Out (video only)"
                color="purple" onClick={this._popOutVideoOnly} />
        <Button id="pop-out-regular" text="Video Pop Out (video & system message)"
                color="purple" onClick={this._popOutRegular} />
      </div>
    );
  }
});

React.render(
  <VideoPopOut />,
  document.getElementById('comp-video-pop-out')
);

