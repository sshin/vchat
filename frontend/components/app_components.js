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

  render: function() {
    return (
      <div className="form-item">
        <label htmlFor={this.props.id}>{this.props.label}</label>
        <input id={this.props.id} maxLength={this.props.maxLength}
               placeholder={this.props.placeholder} type={this.props.type}
               onKeyDown={this.props.onKeyDown} ref="input"></input>
      </div>
    );
  }
});


/**
 * Dialog component.
 *
 * Args:
 *  id: Html id, Component will automatically generate dialog id.
 *  color: Close dialog button color.
 *  buttonText: Text for close button.
 *  header: Dialog header text.
 *  children: React children. This is used for content.
 */
var Dialog = React.createClass({
  /**
   * Open dialog and automatically focus first input.
   */
  _openDialog: function() {
    var $el = $(this.refs['overlayWrapper'].getDOMNode());

    if ($el.hasClass('hide')) {
      $el.removeClass('hide');
      $($el.find('.dialog-content :input:first')[0]).focus();
    } else {
      $el.addClass('hide');
    }
  },

  closeDialog: function() {
    var $el = $(this.refs['overlayWrapper'].getDOMNode());
    $el.addClass('hide');
  },

  render: function() {
    // Default button color is blue.
    var color = 'blue';
    if (this.props.color) color = this.props.color;
    var dialogId = this.props.id + '-dialog';

    return (
      <div>
        <Button id={this.props.id} color={color}
                text={this.props.buttonText} onClick={this._openDialog} />
        <div id={dialogId} className="dialog-overlay hide" ref="overlayWrapper">
          <div className="dialog-inner-wrapper center-div">
            <div className="dialog-content-header-wrapper">
              <div className="full-width dialog-content-header">
                {this.props.header}
              </div>
              <button className="dialog-close float-right btn red-btn"
                      data-target={dialogId} onClick={this.closeDialog}>Close</button>
            </div>
            <div className="dialog-content form-item">{this.props.children}</div>
          </div>
        </div>
      </div>
    );
  }
});


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
