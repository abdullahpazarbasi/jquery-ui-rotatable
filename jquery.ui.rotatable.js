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
 * AlsoRotate extension
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
        rotate: function (event, ui) {}, // callback while rotating
        start: function (event, ui) {}, // callback when rotation starts
        stop: function (event, ui) {}, // callback when rotation stops
        wheel: true,
        wheelStep: 7.5
    },
    plugins: {},
    handlers: {},
    elementStartAngle: 0,
    elementCurrentAngle: 0,
    elementStopAngle: 0,
    mouseStartAngle: 0,
    isRotating: false,
    hasRotated: false,

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

    _mod: function (n, m) {
        return ((n % m) + m) % m;
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

    _calculateSnap: function (degrees) {
        return (Math.round(degrees / this.options.snapStep) * this.options.snapStep);
    },

    _getElementOffset: function () {
        this._do(0);
        var offset = this.element.offset();
        this._do(this.elementCurrentAngle);
        return offset;
    },

    _isRotationOriginPositionGiven: function () {
        return (typeof this.options.rotationOriginPosition.top === 'number') || (typeof this.options.rotationOriginPosition.left === 'number');
    },

    _getRotationOriginPositionTop: function () {
        if (typeof this.options.rotationOriginPosition.top === 'number') {
            return this.options.rotationOriginPosition.top;
        }
        return Math.round(this.element.height() / 2);
    },

    _getRotationOriginPositionLeft: function () {
        if (typeof this.options.rotationOriginPosition.left === 'number') {
            return this.options.rotationOriginPosition.left;
        }
        return Math.round(this.element.width() / 2);
    },

    _calculateOrigin: function () {
        var elementOffset = this._getElementOffset();
        if (this._isRotationOriginPositionGiven()) {
            return {
                x: elementOffset.left + this._getRotationOriginPositionLeft(),
                y: elementOffset.top + this._getRotationOriginPositionTop()
            };
        }
        // or
        var transformOrigin = this.element.css('transform-origin');
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
            x: elementOffset.left + Math.round(this.element.width() / 2),
            y: elementOffset.top + Math.round(this.element.height() / 2)
        };
    },

    _calculateRotationAngleViaMousePosition: function (event) {
        var origin = this._calculateOrigin();
        var xFromOrigin = event.pageX - origin.x;
        var yFromOrigin = event.pageY - origin.y;
        var mouseAngle = this._angleInDegrees(Math.atan2(yFromOrigin, xFromOrigin));
        var rotateAngle = mouseAngle - this.mouseStartAngle + this.elementStartAngle;
        if (this.options.snap || event.shiftKey) {
            rotateAngle = this._calculateSnap(rotateAngle);
        }
        return this._mod(rotateAngle, 360);
    },

    _do: function (angle) {
        var element = this.element;
        var oldAngle = null;
        var currentTransform = element.css('transform');
        if (currentTransform === undefined) {
            return;
        }
        if (this._isRotationOriginPositionGiven()) {
            element.css('transform-origin', this._getRotationOriginPositionLeft() + 'px ' + this._getRotationOriginPositionTop() + 'px');
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
    },

    _create: function() {
        var o = this.options;
        this.element.addClass('ui-rotatable');
        if (o.handle) {
            this._placeHandle();
        }
        this.handlers = {
            _mouseWheel: $.proxy(this._mouseWheel, this)
        };
        if (o.wheel) {
            this.element.bind('wheel', this.handlers._mouseWheel);
        }
        this.rotationOriginPosition(o.rotationOriginPosition);
        this.elementCurrentAngle = this._mod(this.options.angle || 0, 360);
        this._do(this.elementCurrentAngle);
        this._mouseInit();
    },

    _destroy: function () {
        this._mouseDestroy();
        this.element.removeClass('ui-rotatable');
        this.element.off('rotatable');
        this.element.find('.ui-rotatable-handle:first').remove();
        if (this.options.wheel) {
            this.element.unbind('wheel', this.handlers._mouseWheel);
        }
    },

    _placeHandle: function () {
        var o = this.options;
        if (!this.element) {
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
        if (jqHandle.css('position') !== 'absolute') {
            jqHandle.css('position', 'absolute');
        }
        if (jqHandle.width() < 1) {
            jqHandle.width(9);
        }
        if (jqHandle.height() < 1) {
            jqHandle.height(9);
        }
        if (jqHandle.css('cursor') === 'auto') {
            jqHandle.css('cursor', 'grab');
        }
    },

    _getJqHandle: function () {
        var o = this.options;
        if (o.handle) {
            return this.element.find('.ui-rotatable-handle:first');
        }
        return this.element;
    },

    _propagate: function (n, event) { // propagates events
        $.ui.plugin.call(this, n, [ event, this.ui() ]);
        (n !== 'rotate' && this._trigger(n, event, this.ui()));
    },

    _setOption: function (key, value) {
        this._super(key, value);
    },

    _mouseCapture: function (event) { // event handler
        var o = this.options;
        if (!this.element || this.element.disabled || o.disabled) {
            return false;
        }
        if (o.handle) {
            var jqHandle = this._getJqHandle();
            if (event.target !== jqHandle[0]) {
                return false;
            }
        }
        else {
            if (event.target !== this.element[0]) {
                return false;
            }
        }
        return true;
    },

    _mouseStart: function (event) { // event handler
        var jqHandle = this._getJqHandle();
        var origin = this._calculateOrigin();
        var startXFromOrigin = event.pageX - origin.x;
        var startYFromOrigin = event.pageY - origin.y;
        this.mouseStartAngle = this._angleInDegrees(Math.atan2(startYFromOrigin, startXFromOrigin));
        this.elementStartAngle = this.elementCurrentAngle;
        this.isRotating = true;
        this.hasRotated = false;
        this.element.addClass('ui-rotatable-rotating');
        if (jqHandle.length > 0) {
            if (jqHandle.css('cursor') === 'grab') {
                jqHandle.css('cursor', 'grabbing');
            }
        }
        this._propagate('start', event);
        return true;
    },

    _mouseDrag: function (event) { // event handler
        if (!this.element || this.element.disabled || this.options.disabled) {
            return false;
        }
        var rotateAngle = this._calculateRotationAngleViaMousePosition(event);
        var previousRotateAngle = this.elementCurrentAngle;
        this.elementCurrentAngle = rotateAngle;
        if (this._propagate('rotate', event) === false) {
            this.elementCurrentAngle = previousRotateAngle;
            return false;
        }
        var ui = this.ui();
        if (this._trigger('rotate', event, ui) === false) {
            this.elementCurrentAngle = previousRotateAngle;
            return false;
        }
        else if (ui.angle.current !== rotateAngle) {
            rotateAngle = ui.angle.current;
            this.elementCurrentAngle = rotateAngle;
        }
        this._do(rotateAngle);
        if (previousRotateAngle !== rotateAngle) {
            this.hasRotated = true;
        }
        return false;
    },

    _mouseStop: function (event) { // event handler
        if (!this.element) {
            return false;
        }
        var jqHandle = this._getJqHandle();
        this.isRotating = false;
        this.elementStopAngle = this.elementCurrentAngle;
        this.element.removeClass('ui-rotatable-rotating');
        if (jqHandle.length > 0) {
            if (jqHandle.css('cursor') === 'grabbing') {
                jqHandle.css('cursor', 'grab');
            }
        }
        this._propagate('stop', event);
        return false;
    },

    _mouseWheel: function (event) { // event handler
        if (!this.element || this.element.disabled || this.options.disabled) {
            return false;
        }
        var angle = Math.round(event.originalEvent.deltaY * this._num(this.options.wheelStep));
        if (this.options.snap || event.shiftKey) {
            angle = this._calculateSnap(angle);
        }
        angle = this.elementCurrentAngle + angle;
        this.angle(angle);
        this._trigger('rotate', event, this.ui());
        return true;
    },

    angle: function (angle) { // accessor
        var o = this.options;
        if (angle === undefined) {
            return o.angle;
        }
        o.angle = angle;
        this.elementCurrentAngle = this._mod(angle, 360);
        this._do(o.angle);
    },

    handle: function (handle) {
        var o = this.options;
        if (handle === undefined) {
            return o.handle;
        }
        o.handle = handle;
        if (o.handle) {
            this._placeHandle();
        }
    },

    handleElementSelector: function (handleElementSelector) { // accessor
        var o = this.options;
        if (handleElementSelector === undefined) {
            return o.handleElementSelector;
        }
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

    ui: function () {
        return {
            element: this.element,
            angle: {
                start: this.elementStartAngle,
                current: this.elementCurrentAngle,
                stop: this.elementStopAngle
            }
        }
    }

});

// Rotatable Extensions

$.ui.plugin.add('rotatable', 'alsoRotate', {

    start: function () {
        var that = $(this).rotatable('instance'), o = that.options;
        $(o.alsoRotate).each(function () {
            var element = $(this);
            element.data('ui-rotatable-alsorotate', {});
        });
    },

    rotate: function (event, ui) {
        var that = $(this).rotatable('instance'), o = that.options; console.log(JSON.stringify(o, null, 2));
        $(o.alsoRotate).each(function () {
            var element = $(this);
            var start = element.data('ui-rotatable-alsorotate');
        });
    },

    stop: function () {
        $(this).removeData('ui-rotatable-alsorotate');
    }

});

// /Rotatable Extensions

var widgetsRotatable = $.ui.rotatable;

return $.ui.rotatable;

}));
