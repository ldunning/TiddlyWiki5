/*\
title: $:/core/modules/widgets/droppable.js
type: application/javascript
module-type: widget

Droppable widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DroppableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DroppableWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DroppableWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("div");
	domNode.className = "tc-droppable";
	// Add event handlers
	$tw.utils.addEventListeners(domNode,[
		{name: "dragenter", handlerObject: this, handlerMethod: "handleDragEnterEvent"},
		{name: "dragover", handlerObject: this, handlerMethod: "handleDragOverEvent"},
		{name: "dragleave", handlerObject: this, handlerMethod: "handleDragLeaveEvent"},
		{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"}
	]);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
	// Stack of outstanding enter/leave events
	this.currentlyEntered = [];
};

DroppableWidget.prototype.enterDrag = function(event) {
	if(this.currentlyEntered.indexOf(event.target) === -1) {
		this.currentlyEntered.push(event.target);
	}
	// If we're entering for the first time we need to apply highlighting
	$tw.utils.addClass(this.domNodes[0],"tc-dragover");
};

DroppableWidget.prototype.leaveDrag = function(event) {
	var pos = this.currentlyEntered.indexOf(event.target);
	if(pos !== -1) {
		this.currentlyEntered.splice(pos,1);
	}
	// Remove highlighting if we're leaving externally. The hacky second condition is to resolve a problem with Firefox whereby there is an erroneous dragenter event if the node being dragged is within the dropzone
	if(this.currentlyEntered.length === 0 || (this.currentlyEntered.length === 1 && this.currentlyEntered[0] === $tw.dragInProgress)) {
		this.currentlyEntered = [];
		$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
	}
};

DroppableWidget.prototype.handleDragEnterEvent  = function(event) {
	this.enterDrag(event);
	// Tell the browser that we're ready to handle the drop
	event.preventDefault();
	// Tell the browser not to ripple the drag up to any parent drop handlers
	event.stopPropagation();
	return false;
};

DroppableWidget.prototype.handleDragOverEvent  = function(event) {
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Tell the browser that we're still interested in the drop
	event.preventDefault();
	event.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy
	return false;
};

DroppableWidget.prototype.handleDragLeaveEvent  = function(event) {
	this.leaveDrag(event);
	return false;
};

DroppableWidget.prototype.handleDropEvent  = function(event) {
	var self = this;
	this.leaveDrag(event);
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	var dataTransfer = event.dataTransfer;
	// Remove highlighting
	$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
	// Try to import the various data types we understand
	$tw.utils.importDataTransfer(dataTransfer,null,function(fieldsArray) {
		fieldsArray.forEach(function(fields) {
			self.performActions(fields.title || fields.text,event);
		});
	});
	// Tell the browser that we handled the drop
	event.preventDefault();
	// Stop the drop ripple up to any parent handlers
	event.stopPropagation();
	return false;
};

DroppableWidget.prototype.performActions = function(title,event) {
	if(this.dropzoneActions) {
		this.invokeActionString(this.dropzoneActions,this,event,{actionTiddler: title});
	}
};

/*
Compute the internal state of the widget
*/
DroppableWidget.prototype.execute = function() {
	this.dropzoneActions = this.getAttribute("actions");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DroppableWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.droppable = DroppableWidget;

})();
