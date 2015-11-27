/**
 * Button component.
 *
 * Args:
 *  id: Html id.
 *  color: blue | green | purple | red | none(default)
 *  onClick: Callback for onClick event.
 *  dataValue: Custom value attribute.
 *  text: Button text.
 */
var Button = React.createClass({
  render: function() {
    var classString = 'full-width btn';
    if (this.props.color) classString += ' ' + this.props.color + '-btn';

    return (
      <button id={this.props.id}
              className={classString}
              onClick={this.props.onClick}
              data-value={this.props.dataValue}>
        {this.props.text}
      </button>
    );
  }
});
