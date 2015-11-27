/**
 * Alert bar component.
 *
 * Args:
 *  alertType: alert(default) | info.
 */
var AlertBar = React.createClass({
  alert: function(message, seconds) {
    var $bar = $(this.refs['alertBar'].getDOMNode());
    var $text = $(this.refs['alertBarText'].getDOMNode());
    $text.text(message);
    $bar.removeClass('hide');
    var time = 2000;
    if (typeof seconds !== 'undefined') time = seconds;
    //setTimeout(function() {
    //  $bar.addClass('hide');
    //  $text.text('');
    //}, time);
  },

  render: function() {
    var classString = 'full-width alert-bar hide';
    var icon;
    var alertType = 'alert';
    if (this.props.alertType) alertType = this.props.alertType;
    classString += ' ' + alertType;
    if (alertType == 'alert') {
      icon = '<img src="' + CONFIG.imageUrl + 'alert_icon.png">';
    } else {
      icon = '<img src="' + CONFIG.imageUrl + 'info_icon.png">';
    }

    return (
      <div className={classString} ref="alertBar">
        <div className="alert-bar-text-wrapper">
          <span className="alert-icon-wrapper" dangerouslySetInnerHTML={{__html: icon}}></span>
          <div className="alert-bar-text" ref="alertBarText"></div>
        </div>
      </div>
    );
  }
});
