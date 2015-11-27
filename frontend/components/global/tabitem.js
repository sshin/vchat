/**
 * Tab item component used by Tab component.
 */
var TabItem = React.createClass({
  _selectTab: function() {
    this.props.selectTab(this.props.data.id);
  },

  render: function() {
    var classString = 'tab-items';
    if (this.props.data.selected) classString += ' tab-selected';

    return (
      <li id={this.props.data.id} data-target={this.props.data.target}
          className={classString} onClick={this._selectTab}>
        <div className="tab-text-wrapper">{this.props.data.text}</div>
      </li>
    );
  }
});
