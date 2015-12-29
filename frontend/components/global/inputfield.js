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
 *  disabled: Input field is initially disabled. (optional)
 */
var InputField = React.createClass({
  componentDidMount: function() {
    this._$el = $(this.refs['input'].getDOMNode());
    if (this.props.disabled) this.disableInput();
  },

  disableInput: function() {
    this._$el.attr('disabled', 'true');
  },

  enableInput: function() {
    this._$el.removeAttr('disabled');
    this._$el.focus();
  },

  getInputElement: function() {
    return this._$el;
  },

  setVal: function(val) {
    this._$el.val(val);
  },

  getVal: function() {
    return this._$el.val();
  },

  highlight: function(color) {
    if (typeof color === 'undefined') color = 'red';
    var className = color + '-border';
    this._$el.addClass(className);
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
               value={this.props.value} onKeyDown={this.props.onKeyDown} ref="input"></input>
      </div>
    );
  }
});
