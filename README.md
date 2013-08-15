# jQuery.WhenIType

jQuery.WhenIType is a jQuery plugin that provides keyboard shortcuts with a fluent API.  It supports simple shortcuts ("a", "b"), shortcuts with modifier keys ("ctrl+s", "ctrl+shift+s"), and chords ("iddqd", "idkfa").

This library is based on the WhenIType module of the [Atlassian User Interface library](https://bitbucket.org/atlassian/aui/).  It also includes code from the [jQuery Hotkeys plugin] (https://github.com/jeresig/jquery.hotkeys).  The main changes are:
* All dependencies on the AUI library have been removed
* Conditional actions (if/ifnot) have been added.  The AUI version of whenIType was hardcoded to disable keyboard shortcuts when a dialog is open, so this can be used to recreate that functionality as well as to support other situations where a shortcut needs to be temporarily disabled.
* The jQuery Hotkeys code included in this plugin does not use [jQuery special events](http://benalman.com/news/2010/03/jquery-special-events/).
* The JSON file handling from the AUI version has been removed.  This could become an optional add-on at some point in the future.

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/whenitype/jquery.whenitype/master/dist/jquery.whenitype.min.js
[max]: https://raw.github.com/whenitype/jquery.whenitype/master/dist/jquery.whenitype.js

In your web page:

```html
<script src="jquery.js"></script>
<script src="dist/jquery.whenitype.min.js"></script>
<script>
$(function() {
	$(document).whenIType("gh").or("gd").goTo("dashboard.html");
	$(document).whenIType("c").click("#create");
});
</script>
```

## Examples

Simple shortcuts execute an action when a single key is pressed.

```javascript
$(document).whenIType("c").or("d").execute(function () { alert('You pressed "c" or "d".'); });
```

Modifier keys, like ctrl and alt, are also supported.  These shortcuts currently use the same syntax as the [jQuery Hotkeys plugin] (https://github.com/jeresig/jquery.hotkeys), so when more than one modifier is used they must be in alphabetical order (alt, ctrl, shift).

```javascript
$(document).whenIType("ctrl+s").execute(function () { alert('You pressed "ctrl+s".'); });
$(document).whenIType("alt+ctrl+s").execute(function () { alert('You pressed "alt+ctrl+s".'); });
$(document).whenIType("alt+ctrl+shift+s").execute(function () { alert('You pressed "ctrl+alt+shift+s".'); });
```

Another type of shortcut is a "chord" of two or more characters.  To fire one of these shortcuts, you must press each key in the chord within a short period of time.

```javascript
$(document).whenIType("iddqd").execute(function() { alert('DEGREELESS MODE') });
$(document).whenIType("idkfa").or("idfa").execute(function() { alert('VERY HAPPY AMMO ADDED') });
```

## Documentation

The basic form of a jQuery.whenIType action is the following:

```
$(SELECTOR).whenIType("SHORTCUT")[.or("SHORTCUT"]*[.if/ifnot(CONDITION)]*.ACTION([ARGUMENTS...])
```

Where:
* SELECTOR is any [jQuery selector](http://api.jquery.com/category/selectors/)
* SHORTCUT is a string that represents the shortcut.  The syntax is basically the same as that of the [jQuery.hotkeys plugin](https://github.com/jeresig/jquery.hotkeys).
  * Optionally, any number of additional shortcuts can be specified with an "or" action.
* Optionally, any number of conditions can be specified.  The actions for the shortcut will only be executed if all "if" conditions are true and all "ifnot" conditions are false.
  * CONDITION is a function that returns a boolean value.
* ACTION is the action to execute when the keyboard shortcut is pressed.
  * ARGUMENTS are the arguments for the ACTION (if any)

### Modifiers

#### or

Binds additional keyboard shortcuts.

Arguments:
* keys - string - the shortcut to bind

### if
Adds a condition for whether the keyboard shortcut is enabled.  The condition will be checked each time the shortcut is pressed.

Arguments:
* condition - function - a function that returns true if the shortcut can be executed; it will not be passed any parameters

### ifnot
Adds a condition for whether the keyboard shortcut is disabled.  The condition will be checked each time the shortcut is pressed.

Arguments:
* condition - function - a function that returns true if the shortcut cannot currently be executed; it will not be passed any parameters



### Actions

All of the actions return the whenIType object.  The actions that accept [jQuery selectors](http://api.jquery.com/category/selectors/) as parameters will add or append to the "title" attribute of the specified element with a message that describes how to activate the shortcut.

#### execute
Executes a provided function.

Arguments:
* func - function - the function to execute; it will be passed no arguments and its return value will not be used


#### goTo
Navigates to a specified _url_.

Arguments:
* location - string - the URL to navigate to


#### followLink
Follows the link specified by the _selector_.

Arguments:
* selector - string - the jQuery selector for the link to follow


#### click
Clicks the element specified by the _selector_.

Arguments:
* selector - string - thejQuery selector for the element to click


#### moveToAndClick
Scrolls to an element (if out of view) and then fires a click event on it.

Arguments:
* selector - string - the jQuery selector for the element to move to and click

#### moveToAndFocus
Scrolls to an element (if out of view) and then focuses it.

Arguments:
* selector - string - the jQuery selector for the element to move to and click



### Other

#### unbind
Unbinds the shortcut keys.
