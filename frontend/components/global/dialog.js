/**
 * Dialog component.
 *
 * Args:
 *  id: Html id, Component will automatically generate dialog id.
 *  color: Close dialog button color.
 *  buttonText: Text for close button.
 *  header: Dialog header text.
 *  children: React children. This is used for content.
 *  noButton: boolean.
 *  onOpenDialog: callback function after dialog is opened. (optional)
 */
var Dialog = React.createClass({
  componentDidMount: function() {
    this._$el = $(this.refs['overlayWrapper'].getDOMNode());
  },
  /**
   * Open dialog and automatically focus first input.
   */
  openDialog: function() {
    if (this._$el.hasClass('hide')) {
      this._$el.removeClass('hide');
      if (!this.props.noAutoFocus) $(this._$el.find('.dialog-content :input:first')[0]).focus();
    } else {
      this._$el.addClass('hide');
    }

    if (this.props.onOpenDialog) this.props.onOpenDialog();
  },

  closeDialog: function() {
    this._$el.addClass('hide');
  },

  render: function() {
    // Default button color is blue.
    var color = 'blue';
    if (this.props.color) color = this.props.color;
    var dialogId = this.props.id + '-dialog';

    return (
      <div>
        {this.props.noButton ?
          '' :
          <Button id={this.props.id} color={color} text={this.props.buttonText}
                  onClick={this.openDialog}/>
        }
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
