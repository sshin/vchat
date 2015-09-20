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
var Button = React.createClass({displayName: "Button",
  render: function() {
    var classString = 'full-width btn';
    if (this.props.color) classString += ' ' + this.props.color + '-btn';

    return (
      React.createElement("button", {id: this.props.id, 
              className: classString, 
              onClick: this.props.onClick, 
              "data-value": this.props.dataValue}, 
        this.props.text
      )
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
var ____Class0=React.Component;for(var ____Class0____Key in ____Class0){if(____Class0.hasOwnProperty(____Class0____Key)){InputField[____Class0____Key]=____Class0[____Class0____Key];}}var ____SuperProtoOf____Class0=____Class0===null?null:____Class0.prototype;InputField.prototype=Object.create(____SuperProtoOf____Class0);InputField.prototype.constructor=InputField;InputField.__superConstructor__=____Class0;function InputField(){"use strict";if(____Class0!==null){____Class0.apply(this,arguments);}}
  Object.defineProperty(InputField.prototype,"getInputElement",{writable:true,configurable:true,value:function() {"use strict";
    return $(this.refs['input'].getDOMNode());
  }});

  Object.defineProperty(InputField.prototype,"getVal",{writable:true,configurable:true,value:function() {"use strict";
    return $(this.refs['input'].getDOMNode()).val();
  }});

  Object.defineProperty(InputField.prototype,"render",{writable:true,configurable:true,value:function() {"use strict";
    return (
      React.createElement("div", {className: "form-item"}, 
        React.createElement("label", {htmlFor: this.props.id}, this.props.label), 
        React.createElement("input", {id: this.props.id, maxLength: this.props.maxLength, 
               placeholder: this.props.placeholder, type: this.props.type, 
               onKeyDown: this.props.onKeyDown, ref: "input"})
      )
    )
  }});


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
var Dialog = React.createClass({displayName: "Dialog",
  _openDialog: function() {
    var $el = $(this.refs['overlayWrapper'].getDOMNode());

    if ($el.hasClass('hide')) {
      $el.removeClass('hide');
    } else {
      $el.addClass('hide');
    }
  },

  _closeDialog: function(e) {
    var $el = $(this.refs['overlayWrapper'].getDOMNode());
    $el.addClass('hide');
  },

  render: function() {
    // Default button color is blue.
    var color = 'blue';
    if (this.props.color) color = this.props.color;
    var dialogId = this.props.id + '-dialog';

    return (
      React.createElement("div", null, 
        React.createElement(Button, {id: this.props.id, color: color, 
                text: this.props.buttonText, onClick: this._openDialog}), 
        React.createElement("div", {id: dialogId, className: "dialog-overlay hide", ref: "overlayWrapper"}, 
          React.createElement("div", {className: "dialog-inner-wrapper center-div"}, 
            React.createElement("div", {className: "dialog-content-header-wrapper"}, 
              React.createElement("div", {className: "full-width dialog-content-header"}, 
                this.props.header
              ), 
              React.createElement("button", {className: "dialog-close float-right btn red-btn", 
                      "data-target": dialogId, onClick: this._closeDialog}, "Close")
            ), 
            React.createElement("div", {className: "dialog-content form-item"}, this.props.children)
          )
        )
      )
    );
  }
});
