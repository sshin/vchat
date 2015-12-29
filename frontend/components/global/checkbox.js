/**
 * Checkbox component.
 *
 * Args:
 *  id: Html id.
 *  color: blue(default) | green | purple | red
 *  selectedText: Text when checkbox is selected.
 *  notSelectedText: Text when checkbox is not selected.
 *  text: Text for both selected / not selected.
 */
var CheckBox = React.createClass({
  componentDidMount: function() {
    this._$el = $(this.refs['checkbox'].getDOMNode());
    this._$text = $(this.refs['text'].getDOMNode());
    this._selectedText = '';
    this._notSelectedText = '';
    if (this.props.text) {
      this._selectedText = this.props.text;
      this._notSelectedText = this.props.text;
    } else {
      if (this.props.selectedText) this._selectedText = this.props.selectedText;
      if (this.props.notSelectedText) this._notSelectedText = this.props.notSelectedText;
    }
    this._renderText();
  },

  select: function() {
    this._$el.addClass('selected');
    this._$el.removeClass('not-selected');
    this._renderText();
  },

  unSelect: function() {
    this._$el.removeClass('selected');
    this._$el.addClass('not-selected');
    this._renderText();
  },

  isSelected: function() {
    return this._$el.hasClass('selected');
  },

  _onClick: function() {
    if (this.isSelected()) {
      this._$el.removeClass('selected');
      this._$el.addClass('not-selected');
    } else {
      this._$el.addClass('selected');
      this._$el.removeClass('not-selected');
    }
    this._renderText();
    if (this.props.onClickEvent) {
      this.props.onClickEvent();
    }
  },

  _renderText: function() {
    if (this.isSelected()) {
      this._$text.text(this._selectedText);
    } else {
      this._$text.text(this._notSelectedText);
    }
  },

  render: function() {
    var wrapperClassString = 'checkbox-wrapper';
    var classString = 'full-width btn';
    if (this.props.color) {
      classString += ' ' + this.props.color + '-btn';
    } else {
      classString +=' blue-btn';
    }

    if (this.props.selected) {
      wrapperClassString += ' selected';
    } else {
      wrapperClassString += ' not-selected';
    }

    return (
      <div id={this.props.id} className={wrapperClassString} ref="checkbox">
        <button id={this.props.id + '-checkbox'}
                className={classString} onClick={this._onClick}>
          <div ref="text">{this.props.text}</div>
        </button>
      </div>
    );
  }
});
