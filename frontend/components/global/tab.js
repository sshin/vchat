/**
 * Tab component.
 *
 * Args:
 *  tabs: Array of tabs(js objects).
 *    - id: Html id for tab.
 *    - text: Tab name.
 *    - target: Target content div.
 *    - selected: Exist and true for initially selected tab.
 */
var Tab = React.createClass({
  componentDidMount: function() {
    for (var i = 0; i < this.props.tabs.length; i++) {
      if (!this.props.tabs[i].selected) {
        $('#' + this.props.tabs[i].target).addClass('hide');
      }
    }
  },

  _selectTab: function(id) {
    var $el = $($('#' + id)[0]);
    for (var i = 0; i < this.props.tabs.length; i++) {
      var $tab = $($('#' + this.props.tabs[i].id)[0]);
      var $target = $($('#' + this.props.tabs[i].target)[0]);
      if (this.props.tabs[i].target == $el.attr('data-target')) {
        $target.removeClass('hide');
        $tab.addClass('tab-selected');
      } else {
        $target.addClass('hide');
        $tab.removeClass('tab-selected');
      }
    }
  },

  render: function() {
    return (
      <div className="tabs-wrapper form-item">
        <div className="tabs-header-wrapper">
          <ul className="tabs-tab-buttons">
            {this.props.tabs.map(function(tab) {
              return <TabItem key={tab.id} data={tab} selectTab={this._selectTab} />
            }.bind(this))}
          </ul>
        </div>
        <div className="tabs-content-wrapper">
          {this.props.children}
        </div>
      </div>
    );
  }
});

