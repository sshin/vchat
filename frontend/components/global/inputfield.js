/**
 * Input field component.
 *
 * Args:
 *  id: Html id.
 *  label: Text used for label.
 *  maxLength: Html input maxlength.
 *  placeholder: Html input placeholder.
 *  type: Html input type.
 *  onKeyDown: Detect keydown event.
 */
var InputField = React.createClass({
  disableInput: function() {
    var $el = this.getInputElement()
    $el.attr('disabled', 'true');
  },

  enableInput: function() {
    var $el = this.getInputElement()
    $el.removeAttr('disabled');
    $el.focus();
  },

  getInputElement: function() {
    return $(this.refs['input'].getDOMNode());
  },

  getVal: function() {
    return this.getInputElement().val();
  },

  highlight: function(color) {
    if (typeof color === 'undefined') color = 'red';
    var className = color + '-border';
    this.getInputElement().addClass(className);
  },

  render: function() {
    var label = this.props.label;
    if (typeof this.props.required !== 'undefined' && this.props.required) {
      label += ' <span class="required-asterisk">*</span>';
    }

    return (
      <div className="form-item">
        <label htmlFor={this.props.id} dangerouslySetInnerHTML={{__html: label}}></label>
        <input id={this.props.id} maxLength={this.props.maxLength}
               placeholder={this.props.placeholder} type={this.props.type}
               onKeyDown={this.props.onKeyDown} ref="input"></input>
      </div>
    );
  }
});
