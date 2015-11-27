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
