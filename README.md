# jQuery UI Rotatable Interaction
## jquery-ui-rotatable

### About
A jQuery UI Interaction which rotates any element by using CSS transform rotate(). Inspired by jQuery UI Resizable and Aidan Rogers's (godswearhats) jquery-ui-rotatable

### Features
- Supports CSS 2D transforms (only 2D)
- Rotation by mouse wheel
- Rotation with/without handle
- Compatible with other jQuery UI widgets and interactions included Draggable and Resizable
- Compatible with Dave Furfero's jQuery UI Touch Punch
- All angles in degrees
- "alsoRotate" extension (under construction)
- "animate" extension (under construction)

### Requirements
- jQuery UI Core
- jQuery UI Core - Widget
- jQuery UI Core - Mouse

### CDN
.

### Options


    {
        disabled: false,
        angle: 0,
        handle: true,
        handleElementSelector: '<div></div>',
        rotationOriginPosition: {
            top: null,
            left: null
        },
        snap: false,
        snapStep: 22.5,
        rotate: function (event, ui) {}, // callback while rotating
        start: function (event, ui) {}, // callback when rotation starts
        stop: function (event, ui) {}, // callback when rotation stops
        wheel: true,
        wheelStep: 7.5
    }



### Used CSS Classes


    .ui-rotatable {}
    .ui-rotatable-rotating {}
    .ui-rotatable-handle {}



### Usages


    $('#foo .bar').rotatable();


----


    $('#foo .bar').resizable().rotatable().draggable();


----


    $('#foo .bar').rotatable({ angle: 30 });



### Demo
(coming soon)

### Thanks
Thanks to jQuery UI Development Team (https://jqueryui.com/about/)

Thanks to Aidan Rogers (https://github.com/godswearhats/jquery-ui-rotatable)

### License
Released under the MIT license, like jQuery

### Authors
Abdullah Pazarbasi http://www.abdullahpazarbasi.com
