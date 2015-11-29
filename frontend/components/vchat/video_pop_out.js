var VideoPopOut = React.createClass({
   _videoOnly: function() {
    window.open(this._getPopOutURL(), '', 'width=831,height=785');
  },

  _getPopOutURL: function() {
    return CONFIG['popOutUrl'] + roomInfo['type'] + '/' + roomInfo['name'];
  },

  render: function() {
    return (
      <div id="video-pop-out-wrapper">
        <Button id="video-only" text="Video Pop Out (no video control & no chat)"
                color="purple" onClick={this._videoOnly} />
      </div>
    );
  }
});

React.render(
  <VideoPopOut />,
  document.getElementById('comp-video-pop-out')
);

