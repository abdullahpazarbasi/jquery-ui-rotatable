/**
 * jQuery UI Rotatable Widget
 *
 * @author Abdullah Pazarbasi (https://github.com/abdullahpazarbasi/jquery-ui-rotatable)
 * @license MIT
 *
 * Features:
 * Supports CSS 2D transform (only 2D)
 * Rotation by mouse wheel
 * Rotation with/without handle
 * Compatible with other jQuery UI widgets included Draggable and Resizable
 * Compatible with Dave Furfero's jQuery UI Touch Punch
 * All angles in degrees
 * "alsoRotate" extension (under construction)
 * "animate" extension (under construction)
 *
 * Classes:
 * .ui-rotatable {}
 * .ui-rotatable-rotating {}
 * .ui-rotatable-rotated {}
 * .ui-rotatable-handle {}
 *
 * Usages:
 * $('#foo .bar').rotatable();
 * $('#foo .bar').resizable().rotatable().draggable();
 * $('#foo .bar').rotatable({ angle: 30 });
 *
 * Inspired by jQuery UI Resizable Widget and Aidan Rogers's (godswearhats) jquery-ui-rotatable Widget
 * Thanks to jQuery UI Development Team (https://jqueryui.com/about/)
 * Thanks to Aidan Rogers (https://github.com/godswearhats/jquery-ui-rotatable)
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory); // AMD. Register as an anonymous module
    }
    else {
        factory(jQuery); // Browser globals
    }
}(function ($) {

$.widget('ui.rotatable', $.ui.mouse, {

    widgetEventPrefix: 'rotate',
    options: {
        classes: {},
        create: null,
        /*cancel: 'input, textarea, button, select, option',*/
        distance: 1,
        delay: 0,
        disabled: false,
        alsoRotate: false,
        angle: 0,
        handle: true,
        handleElementSelector: '<div></div>',
        rotationOriginPosition: {
            top: null,
            left: null
        },
        snap: false,
        snapStep: 22.5,
        /*animate: false,
        animateDuration: 'slow',
        animateEasing: 'swing',*/
        start: function (event, ui) { return true; }, // callback when rotation starts
        rotate: function (event, ui) { return true; }, // callback while rotating
        stop: function (event, ui) { return true; }, // callback when rotation stops
        wheel: true,
        wheelingVerticalStep: null,
        wheelingHorizontalStep: null
    },
    plugins: {},
    handlers: {},
    elementStartAngle: 0,
    elementCurrentAngle: 0,
    elementStopAngle: 0,
    mouseStartAngle: null,

    _num: function (value) {
        return parseFloat(value) || 0;
    },

    _isNumber: function (value) {
        return !isNaN(parseFloat(value));
    },

    _round: function (value, precision) {
        var number = this._num(value);
        var factor = Math.pow(10, precision);
        var tempNumber = number * factor;
        var roundedTempNumber = Math.round(tempNumber);
        return roundedTempNumber / factor;
    },

    _canBeParent: function () {
        if (this.element[0].nodeName.match(/^(canvas|textarea|input|select|button|img)$/i)) {
            return false;
        }
        return true;
    },

    _enableSelection: function (jqElement) {
        jqElement.attr('unselectable', 'off');
        jqElement.css('user-select', 'auto');
        return jqElement.off('.ui-disableSelection');
    },

    _disableSelection: function (jqElement) {
        jqElement.attr('unselectable', 'on');
        jqElement.css('user-select', 'none');
        var eventType = ('onselectstart' in document.createElement('div')) ? 'selectstart' : 'mousedown';
        return jqElement.on(eventType + '.ui-disableSelection', function (event) { event.preventDefault(); });
    },

    _angleInDegrees: function (radians) {
        return radians * 180 / Math.PI;
    },

    _calculateAbsoluteAngle: function (exactDegrees) {
        if (exactDegrees > 360) {
            return exactDegrees - 360;
        }
        if (exactDegrees < 0) {
            return exactDegrees + 360;
        }
        return exactDegrees;
    },

    _calculateSnap: function (degrees) {
        return (Math.round(degrees / this.options.snapStep) * this.options.snapStep);
    },

    _getElementOffset: function () {
        var element = this.element;
        this.perform(element, 0);
        var offset = element.offset();
        this.perform(element, this.elementCurrentAngle);
        return offset;
    },

    _isRotationOriginPositionGiven: function () {
        return (typeof this.options.rotationOriginPosition.top === 'number') || (typeof this.options.rotationOriginPosition.left === 'number');
    },

    getRotationOriginPositionTop: function (element) {
        if (typeof this.options.rotationOriginPosition.top === 'number') {
            return this.options.rotationOriginPosition.top;
        }
        return Math.round(element.height() / 2);
    },

    getRotationOriginPositionLeft: function (element) {
        if (typeof this.options.rotationOriginPosition.left === 'number') {
            return this.options.rotationOriginPosition.left;
        }
        return Math.round(element.width() / 2);
    },

    _calculateOrigin: function () {
        var element = this.element;
        var elementOffset = this._getElementOffset();
        if (this._isRotationOriginPositionGiven()) {
            return {
                x: elementOffset.left + this.getRotationOriginPositionLeft(element),
                y: elementOffset.top + this.getRotationOriginPositionTop(element)
            };
        }
        // or
        var transformOrigin = element.css('transform-origin');
        if (typeof transformOrigin === 'string') {
            var origin = transformOrigin.match(/([\d.]+)px +([\d.]+)px/);
            if (origin !== null) {
                return {
                    x: elementOffset.left + this._num(origin[1]),
                    y: elementOffset.top + this._num(origin[2])
                };
            }
        }
        // or
        return {
            x: elementOffset.left + Math.round(element.width() / 2),
            y: elementOffset.top + Math.round(element.height() / 2)
        };
    },

    _calculateRotationAngleViaMousePosition: function (event) {
        var origin = this._calculateOrigin();
        var mouseAngle = this._calculateMouseAngle(event, origin);
        var rotationAngle = mouseAngle - this._num(this.mouseStartAngle) + this.elementStartAngle;
        if (this.options.snap) {
            rotationAngle = this._calculateSnap(rotationAngle);
        }
        return this._calculateAbsoluteAngle(rotationAngle);
    },

    _calculateMouseAngle: function (event, origin) {
        var horizontalOffsetFromOrigin = event.pageX - origin.x;
        var verticalOffsetFromOrigin = event.pageY - origin.y;
        return this._angleInDegrees(Math.atan2(verticalOffsetFromOrigin, horizontalOffsetFromOrigin));
    },

    perform: function (element, angle) {
        var oldAngle = null;
        var currentTransform = element.css('transform');
        if (currentTransform === undefined) {
            return 0;
        }
        if (this._isRotationOriginPositionGiven()) {
            element.css('transform-origin', this.getRotationOriginPositionLeft(element) + 'px ' + this.getRotationOriginPositionTop(element) + 'px');
        }
        var newTransform = 'rotate(' + angle + 'deg) ';
        if (currentTransform !== 'none') {
            var regex = /matrix\((.*),(.*),(.*),(.*),(.*),(.*)\)/;
            var match = regex.exec(currentTransform);
            if (match !== null) {
                var a = this._num(match[1]);
                var b = this._num(match[2]);
                var c = this._num(match[3]);
                var d = this._num(match[4]);
                var e = this._num(match[5]);
                var f = this._num(match[6]);
                if (e !== 0) {
                    if (f === 0) {
                        newTransform += 'translate(' + e + 'px) ';
                    }
                    else {
                        newTransform += 'translate(' + e + 'px, ' + f + 'px) ';
                    }
                }
                var del = a * d - b * c;
                var x = null;
                var y = null;
                if (a !== 0 || b !== 0) {
                    var r = this._round(Math.sqrt(a * a + b * b), 5);
                    oldAngle = this._angleInDegrees(b > 0 ? Math.acos(a / r) : -Math.acos(a / r));
                    x = r;
                    y = this._round(del / r, 5);
                    if (x !== 1 || y !== 1) {
                        newTransform += 'scale(' + x + (x === y ? '' : ', ' + y) + ') ';
                    }
                    x = Math.atan((a * c + b * d) / (r * r));
                    if (x !== 0) {
                        newTransform += 'skewX(' + this._angleInDegrees(x) + 'deg) ';
                    }
                }
                else if (c !== 0 || d !== 0) {
                    var s = Math.sqrt(c * c + d * d);
                    oldAngle = this._angleInDegrees((Math.PI / 2) - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s)));
                    x = del / s;
                    y = s;
                    if (x !== 1 || y !== 1) {
                        newTransform += 'scale(' + x + (x === y ? '' : ', ' + y) + ') ';
                    }
                    x = Math.atan((a * c + b * d) / (s * s));
                    if (x !== 0) {
                        newTransform += 'skewY(' + this._angleInDegrees(x) + 'deg) ';
                    }
                }
                else { // a = b = c = d = 0
                    newTransform += 'scale(0) ';
                }
            }
        }
        element.css('transform', newTransform);
        return angle;
    },

    _angle: function (angle) {
        this.elementCurrentAngle = this._calculateAbsoluteAngle(this._num(angle));
        return this.perform(this.element, this.elementCurrentAngle);
    },

    _create: function() {
        var o = this.options;
        this.handlers = {
            _mouseWheel: $.proxy(this._mouseWheel, this)
        };
        this.element.addClass('ui-rotatable');
        if (o.handle) {
            this._placeHandle();
        }
        if (o.wheel) {
            this.element.bind('wheel', this.handlers._mouseWheel);
        }
        this.rotationOriginPosition(o.rotationOriginPosition);
        this._angle(o.angle);
        this._mouseInit();
    },

    _destroy: function () {
        this._mouseDestroy();
        this.element.removeClass('ui-rotatable ui-rotatable-rotating ui-rotatable-rotated');
        this.element.off('rotatable');
        this.element.find('.ui-rotatable-handle').remove();
        if (this.options.wheel) {
            this.element.unbind('wheel', this.handlers._mouseWheel);
        }
    },

    _placeHandle: function () {
        var o = this.options;
        if (!this.element || this.element.disabled || o.disabled) {
            return;
        }
        if (!this._canBeParent()) {
            return;
        }
        var jqHandle = this.element.find('.ui-rotatable-handle:first');
        if (jqHandle.length < 1) {
            jqHandle = $(o.handleElementSelector);
            jqHandle.addClass('ui-rotatable-handle');
            jqHandle.appendTo(this.element);
            this._disableSelection(jqHandle);
        }
        //alert('top:' + jqHandle.css('top') + ' right:' + jqHandle.css('right') + ' bottom:' + jqHandle.css('bottom') + ' left:' + jqHandle.css('left'));
        var top = jqHandle.css('top');
        var right = jqHandle.css('right');
        var bottom = jqHandle.css('bottom');
        var left = jqHandle.css('left');
        if (jqHandle.css('position') !== 'absolute') {
            jqHandle.css('position', 'absolute');
        }
        if (jqHandle.width() < 1) {
            jqHandle.width(9);
        }
        if (jqHandle.height() < 1) {
            jqHandle.height(9);
        }
        if (top === 'auto' && bottom === 'auto') {
            jqHandle.css('top', '0px');
        }
        if (left === 'auto' && right === 'auto') {
            jqHandle.css('left', '0px');
        }
        if (jqHandle.css('cursor') === 'auto') {
            jqHandle.css('cursor', 'grab');
        }
    },

    _displaceHandle: function () {
        //
    },

    _getJqHandle: function () {
        var o = this.options;
        if (o.handle) {
            return this.element.find('.ui-rotatable-handle:first');
        }
        return this.element;
    },

    _setOption: function (key, value) {
        this._super(key, value);
    },

    _mouseCapture: function (event) { // event handler
        var element = this.element, o = this.options;
        if (!element || element.disabled || o.disabled) {
            return false;
        }
        if (o.handle) {
            var jqHandle = this._getJqHandle();
            if (event.target !== jqHandle[0]) {
                return false;
            }
        }
        else {
            if (event.target !== element[0]) {
                return false;
            }
        }
        return true;
    },

    _mouseStart: function (event) { // event handler
        var element = this.element;
        if (!element || element.disabled || this.options.disabled) {
            return false;
        }
        var jqHandle = this._getJqHandle();
        var origin = this._calculateOrigin();
        this.mouseStartAngle = this._calculateMouseAngle(event, origin);
        this.elementStartAngle = this.elementCurrentAngle;
        element.removeClass('ui-rotatable-rotated');
        element.addClass('ui-rotatable-rotating');
        if (jqHandle.length > 0) {
            if (jqHandle.css('cursor') === 'grab') {
                jqHandle.css('cursor', 'grabbing');
            }
        }
        var ui = this.ui();
        $.ui.plugin.call(this, 'start', [ event, ui ]); // calling extension methods
        return this._trigger('start', event, ui); // calling callback
    },

    _mouseDrag: function (event, originalUi) { // event handler
        var element = this.element;
        if (!element || element.disabled || this.options.disabled) {
            return false;
        }
        var rotationAngle = this._calculateRotationAngleViaMousePosition(event);
        var previousRotateAngle = this.elementCurrentAngle;
        this.elementCurrentAngle = rotationAngle;
        var ui = this.ui();
        $.ui.plugin.call(this, 'rotate', [ event, ui ]); // calling extension methods
        if (this._trigger('rotate', event, ui) === false) { // when callback returns false
            this.elementCurrentAngle = previousRotateAngle;
            return false;
        }
        if (previousRotateAngle !== this._angle(rotationAngle)) {
            element.addClass('ui-rotatable-rotated');
        }
        return false;
    },

    _mouseStop: function (event) { // event handler
        var element = this.element;
        if (!element || element.disabled || this.options.disabled) {
            return false;
        }
        this.elementStopAngle = this.elementCurrentAngle;
        element.removeClass('ui-rotatable-rotating');
        var jqHandle = this._getJqHandle();
        if (jqHandle.length > 0) {
            if (jqHandle.css('cursor') === 'grabbing') {
                jqHandle.css('cursor', 'grab');
            }
        }
        var ui = this.ui();
        $.ui.plugin.call(this, 'stop', [ event, ui ]); // calling extension methods
        this._trigger('stop', event, ui); // calling callback
        this.mouseStartAngle = null;
        return false;
    },

    _mouseWheel: function (event) { // event handler
        var o = this.options;
        if (!this.element || this.element.disabled || o.disabled) {
            return true;
        }
        var wheelingVerticalStep = 1;
        var wheelingHorizontalStep = 1;
        var snapStep = this._num(o.snapStep);
        if (snapStep !== 0) {
            wheelingVerticalStep = snapStep;
            wheelingHorizontalStep = snapStep;
        }
        if (typeof o.wheelingVerticalStep === 'number') {
            wheelingHorizontalStep = wheelingVerticalStep = o.wheelingVerticalStep;
        }
        if (typeof o.wheelingHorizontalStep === 'number') {
            wheelingHorizontalStep = o.wheelingHorizontalStep;
        }
        var angle = 0;
        if (this._num(event.originalEvent.deltaY) > 0) {
            angle = wheelingVerticalStep;
        }
        else if (this._num(event.originalEvent.deltaY) < 0) {
            angle = -1 * wheelingVerticalStep;
        }
        else if (this._num(event.originalEvent.deltaX) > 0) {
            angle = wheelingHorizontalStep;
        }
        else if (this._num(event.originalEvent.deltaX) < 0) {
            angle = -1 * wheelingHorizontalStep;
        }
        if (o.snap) {
            angle = this._calculateSnap(angle);
        }
        if (angle === 0) {
            return true;
        }
        angle = this.elementCurrentAngle + angle;
        this._angle(angle);
        var ui = this.ui();
        $.ui.plugin.call(this, 'rotate', [ event, ui ]); // calling extension methods
        this._trigger('rotate', event, ui);
        return false; // false means preventing default
    },

    angle: function (angle) { // accessor
        var o = this.options;
        if (angle === undefined) {
            return o.angle;
        }
        o.angle = this._angle(angle);
    },

    handle: function (handle) {
        var o = this.options;
        if (handle === undefined) {
            return o.handle;
        }
        if (handle) {
            if (!o.handle) {
                this._placeHandle();
            }
        }
        else {
            if (o.handle) {
                this._displaceHandle();
            }
        }
        o.handle = handle;
    },

    wheel: function (wheel) {
        var element = this.element, o = this.options;
        if (wheel === undefined) {
            return o.wheel;
        }
        if (wheel) {
            if (!o.wheel) {
                element.bind('wheel', this.handlers._mouseWheel);
            }
        }
        else {
            if (o.wheel) {
                element.unbind('wheel', this.handlers._mouseWheel);
            }
        }
        o.wheel = wheel;
    },

    handleElementSelector: function (handleElementSelector) { // accessor
        var o = this.options;
        if (handleElementSelector === undefined) {
            return o.handleElementSelector;
        }
        if (o.handleElementSelector === handleElementSelector) {
            return;
        }
        this._displaceHandle();
        o.handleElementSelector = handleElementSelector;
        if (o.handle) {
            this._placeHandle();
        }
    },

    rotationOriginPosition: function (position) { // accessor
        var o = this.options;
        if (position === undefined) {
            return o.rotationOriginPosition;
        }
        if (typeof position.top === 'number') {
            o.rotationOriginPosition.top = position.top;
        }
        if (typeof position.left === 'number') {
            o.rotationOriginPosition.left = position.left;
        }
    },

    currentAngle: function () {
        return this.elementCurrentAngle;
    },

    ui: function () {
        return {
            element: this.element,
            angle: {
                mouseStart: this.mouseStartAngle,
                start: this.elementStartAngle,
                current: this.elementCurrentAngle,
                stop: this.elementStopAngle
            }
        }
    }

});

// Rotatable Extensions

$.ui.plugin.add('rotatable', 'animate', {

    stop: function (event, ui) {
        // todo: complete here
    }

});

$.ui.plugin.add('rotatable', 'alsoRotate', {

    start: function (event, ui) {
        var instance = $(this).rotatable('instance'), o = instance.options;
        $(o.alsoRotate).each(function () {
            var element = $(this);
            // do nothing
        });
    },

    rotate: function (event, ui) {
        var instance = $(this).rotatable('instance'), o = instance.options;
        $(o.alsoRotate).each(function () {
            var element = $(this);
            instance.perform(element, instance.elementCurrentAngle);
        });
    },

    stop: function (event, ui) {
        // do nothing
    }

});

// /Rotatable Extensions

var widgetsRotatable = $.ui.rotatable;

return $.ui.rotatable;

}));
