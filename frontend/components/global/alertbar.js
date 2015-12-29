/**
 * Alert bar component.
 *
 * Args:
 *  alertType: alert(default) | info.
 */
var AlertBar = React.createClass({
  componentDidMount: function() {
    this._$bar = $(this.refs['alertBar'].getDOMNode());
    this._$text = $(this.refs['alertBarText'].getDOMNode());
  },

  alert: function(message) {
    this._$text.text(message);
    this._$bar.removeClass('hide');
    setTimeout(function() {
      this.hide();
    }.bind(this), 1500);
  },

  hide: function() {
    this._$bar.addClass('hide');
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
