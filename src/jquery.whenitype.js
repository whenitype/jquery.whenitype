/**
 * Keyboard commands with syntactic sugar.
 *
 * <strong>Usage:</strong>
 * <pre>
 * $(document).whenIType("gh").or("gd").goTo("/secure/Dashboard.jspa");
 * $(document).whenIType("c").click("#create_link");
 * </pre>
 *
 * @param keys - Key combinations, modifier keys are "+" deliminated. e.g "ctrl+b"
 */
(function (exports, $) {
    "use strict";

    // <jQuery.hotkeys>

    var specialKeys = {
        8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
        20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
        37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
        96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
        104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111: "/",
        112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
        120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 188: ",", 190: ".",
        191: "/", 224: "meta"
    };

    var shiftNums = {
        "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
        "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
        ".": ">", "/": "?", "\\": "|"
    };

    // This is for keeping track of chords
    var TimedNumber = function (timer) {
        this.num = 0;
        this.timer = timer > 0 ? timer : false;
    };
    TimedNumber.prototype.val = function () {
        return this.num;
    };
    TimedNumber.prototype.inc = function () {
        if (this.timer) {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(jQuery.proxy(TimedNumber.prototype.reset, this), this.timer);
        }
        this.num++;
    };
    TimedNumber.prototype.reset = function () {
        if (this.timer) {
            clearTimeout(this.timeout);
        }
        this.num = 0;
    };

    var isPressed = function (key, possible) {
        var keys = key.split(' ');
        for (var i = 0, len = keys.length; i < len; i++) {
            if (possible[keys[i]]) {
                return true;
            }
        }
        return false;
    };

    var keyToLower = function (key) {
        return key.toLowerCase();
    };
    var keyComboArrayToString = function (keyCombo) {
        return keyCombo.join('');
    };
    var indexDictionary = {};

    var handleKeyEvent = function (event, keyCombos, callback) {
        // Don't fire in text-accepting inputs that we didn't directly bind to
        // important to note that $.fn.prop is only available on jquery 1.6+
        // UPDATE: do allow this if the ctrl or alt key is pressed
        if ((this !== event.target && !event.altKey && !event.ctrlKey && !event.metaKey) && (/textarea|select/i.test(event.target.nodeName) ||
			event.target.type === "text" || $(event.target).prop('contenteditable') === 'true')) {
            return;
        }

        // Keypress represents characters, not special keys
        var special = event.type !== "keypress" && specialKeys[event.which],
			character = String.fromCharCode(event.which).toLowerCase(),
			modif = "", possible = {};

        // check combinations (alt|ctrl|shift+anything)
        if (event.altKey && special !== "alt") {
            modif += "alt+";
        }

        if (event.ctrlKey && special !== "ctrl") {
            modif += "ctrl+";
        }

        // TODO: Need to make sure this works consistently across platforms
        if (event.metaKey && !event.ctrlKey && special !== "meta") {
            modif += "meta+";
        }

        if (event.shiftKey && special !== "shift") {
            modif += "shift+";
        }

        if (special) {
            possible[modif + special] = true;
        }
        if (character) {
            possible[modif + character] = true;
        }

        // "$" can be specified as "shift+4" or "$"
        if (/shift+/.test(modif)) {
            possible[modif.replace('shift+', '') + shiftNums[(special || character)]] = true;
        }

        for (var i = 0, l = keyCombos.length; i < l; i++) {
            var combo = keyCombos[i];
            combo = jQuery.map(combo, keyToLower);

            var indexDictionaryKey = keyComboArrayToString(combo);
            var index = indexDictionary[indexDictionaryKey];
            if (!index) {
                index = new TimedNumber(700);
                indexDictionary[indexDictionaryKey] = index;
            }

            var indexValue = index.val();
            if (isPressed(combo[indexValue], possible)) {
                if (indexValue === combo.length - 1) {
                    index.reset();
                    return callback.apply(this, arguments);
                } else {
                    index.inc();
                }
            } else {
                index.reset();
                // For mutli-key combinations, we might have restarted the key sequence.
                if (isPressed(combo[0], possible)) {
                    index.inc();
                }
            }
        }
    };

    // </jQuery.hotkeys>

    // <AJS.WhenIType>

    var isMac = navigator.platform.indexOf('Mac') !== -1;

    //see jquery.hotkeys.js for accepted names.
    var multiCharRegex = /^(backspace|tab|r(ight|eturn)|s(hift|pace|croll)|c(trl|apslock)|alt|pa(use|ge(up|down))|e(sc|nd)|home|left|up|d(el|own)|insert|f\d\d?|numlock|meta)/i;

    var i18n = {
        type_x: 'Type "{0}"',
        then_x: ' then "{0}"',
        or_x: ' OR "{0}"'
    };
    var formatString = function (str) {
        // Based on http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
        var args = Array.prototype.slice.call(arguments, 1);
        return str.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    };

    exports.whenIType = function (keys) {
        var $context = $(this);

        var boundKeyCombos = [],
            executor = $.Callbacks(),
            predicates = [];

        var canExecute = function() {
            var isExecuteAllowed = true;
            var predicateCount = predicates.length;
            for (var i = 0; i < predicateCount; i++) {
                if (!predicates[i]()) {
                    isExecuteAllowed = false;
                    break;
                }
            }
            return isExecuteAllowed;
        };

        var keypressHandler = function (event) {
            return handleKeyEvent(event, boundKeyCombos, function (e) {
                if (!canExecute()) {
                    return;
                }
                executor.fire(e);
                e.preventDefault();
            });
        };

        // Bind an arbitrary set of keys by calling bindKeyCombo on each triggering key combo.
        // A string like "abc 123" means (a then b then c) OR (1 then 2 then 3). abc is one key combo, 123 is another.
        var bindKeys = function (keys) {
            var keyCombos = keys && keys.split ? $.trim(keys).split(' ') : [keys];
            $.each(keyCombos, function () {
                bindKeyCombo(this);
            });
        };

        var hasUnprintables = function (keysArr) {
            // a bit of a heuristic, but works for everything we have. Only the unprintable characters are represented with > 1-character names.
            var i = keysArr.length;
            while (i--) {
                if (keysArr[i].length > 1 && keysArr[i] !== 'space') {
                    return true;
                }
            }
            return false;
        };

        // bind a single key combo to this handler
        // A string like "abc 123" means (a then b then c) OR (1 then 2 then 3). abc is one key combo, 123 is another.
        var isKeypressHandlerAdded = false;
        var bindKeyCombo = function (keyCombo) {
            var keysArr = keyCombo instanceof Array ?
                keyCombo :
                      keyComboArrayFromString(keyCombo.toString());

            var eventType = hasUnprintables(keysArr) ? 'keydown.whenitype' : 'keypress.whenitype';
            boundKeyCombos.push(keysArr);
            if (!isKeypressHandlerAdded) {
                $context.on(eventType, keypressHandler);
                isKeypressHandlerAdded = true;
            }
        };

        // parse out an array of (modifier+key) presses from a single string
        // e.g. "12ctrl+3" becomes [ "1", "2", "ctrl+3" ]
        var keyComboArrayFromString = function (keyString) {

            var keysArr = [],
                currModifiers = '',
                modifierMatch,
                multiCharMatch;

            while (keyString.length) {
                modifierMatch = keyString.match(/^(ctrl|meta|shift|alt)\+/i);
                if (modifierMatch) {
                    currModifiers += modifierMatch[0];
                    keyString = keyString.substring(modifierMatch[0].length);

                } else {
                    multiCharMatch = keyString.match(multiCharRegex);
                    if (multiCharMatch) {
                        keysArr.push(currModifiers + multiCharMatch[0]);
                        keyString = keyString.substring(multiCharMatch[0].length);
                        currModifiers = '';

                    } else {
                        keysArr.push(currModifiers + keyString[0]);
                        keyString = keyString.substring(1);
                        currModifiers = '';
                    }
                }
            }

            return keysArr;
        };

        var addShortcutsToTitle = function (selector) {
            var elem = $(selector),
                title = elem.attr("title") || "",
                keyCombos = boundKeyCombos.slice();

            var shortcutInstructions = elem.data("kbShortcutAppended") || '';

            var isFirst = !shortcutInstructions;
            var originalTitle = isFirst ? title : title.substring(0, title.length - shortcutInstructions.length);

            while (keyCombos.length) {
                shortcutInstructions = appendKeyComboInstructions(keyCombos.shift().slice(), shortcutInstructions, isFirst);
                isFirst = false;
            }

            if (isMac) {
                shortcutInstructions = shortcutInstructions
                    .replace(/Meta/ig, '\u2318') //Apple cmd key
                    .replace(/Shift/ig, '\u21E7'); //Apple Shift symbol
            }

            elem.attr("title", originalTitle + shortcutInstructions);
            elem.data("kbShortcutAppended", shortcutInstructions);
        };

        var removeShortcutsFromTitle = function (selector) {
            var elem = $(selector);
            var shortcuts = elem.data("kbShortcutAppended");

            if (!shortcuts) {
                return;
            }

            var title = elem.attr("title");
            elem.attr('title', title.replace(shortcuts, ''));
            elem.removeData("kbShortcutAppended");
        };

        var appendKeyComboInstructions = function (keyCombo, title, isFirst) {
            if (isFirst) {
                title += " (" + formatString(i18n.type_x, keyCombo.shift());
            } else {
                title = title.replace(/\)$/, "");
                title += formatString(i18n.or_x, keyCombo.shift());
            }

            $.each(keyCombo, function () {
                title += " " + formatString(i18n.then_x, this);
            });
            title += ")";

            return title;
        };

        bindKeys(keys);

        return makeShortcut($context, {
            executor: executor,
            predicates: predicates,
            bindKeys: bindKeys,
            addShortcutsToTitle: addShortcutsToTitle,
            removeShortcutsFromTitle: removeShortcutsFromTitle,
            keypressHandler: keypressHandler
        });
    };

    var makeShortcut = function ($context, options) {
        var executor = options.executor;
        var predicates = options.predicates;
        var bindKeys = options.bindKeys;
        var addShortcutsToTitle = options.addShortcutsToTitle;
        var removeShortcutsFromTitle = options.removeShortcutsFromTitle;
        var keypressHandler = options.keypressHandler;

        var selectorsWithTitlesModified = [];

        return {
            /**
             * Clicks the element specified by the <em>selector</em> argument.
             *
             * @method click
             * @param selector - jQuery selector for element
             * @return {Object}
             */
            click: function (selector) {
                selectorsWithTitlesModified.push(selector);
                addShortcutsToTitle(selector);

                executor.add(function () {
                    var elem = $(selector);
                    if (elem.length > 0) {
                        elem.click();
                    }
                });
                return this;
            },

            /**
             * Navigates to specified <em>location</em>
             *
             * @method goTo
             * @param {String} location - http location
             * @return {Object}
             */
            goTo: function (location) {
                executor.add(function () {
                    window.location.href = location;
                });
                return this;
            },

            /**
             * navigates browser window to link href
             *
             * @method followLink
             * @param selector - jQuery selector for element
             * @return {Object}
             */
            followLink: function (selector) {
                selectorsWithTitlesModified.push(selector);
                addShortcutsToTitle(selector);

                executor.add(function () {
                    var elem = $(selector)[0];
                    if (elem && { 'a': true, 'link': true }[elem.nodeName.toLowerCase()]) {
                        window.location.href = elem.href;
                    }
                });
                return this;
            },

            /**
             * Executes function
             *
             * @method execute
             * @param {function} func
             * @return {Object}
             */
            execute: function (func) {
                var self = this;
                executor.add(function () {
                    func.apply(self, arguments);
                });
                return this;
            },

            /**
             * Scrolls to element if out of view, then clicks it.
             *
             * @method moveToAndClick
             * @param selector - jQuery selector for element
             * @return {Object}
             */
            moveToAndClick: function (selector) {
                selectorsWithTitlesModified.push(selector);
                addShortcutsToTitle(selector);

                executor.add(function () {
                    var elem = $(selector);
                    if (elem.length > 0) {
                        elem.click();
                        elem.moveTo();
                    }
                });
                return this;
            },

            /**
             * Scrolls to element if out of view, then focuses it
             *
             * @method moveToAndFocus
             * @param selector - jQuery selector for element
             * @return {Object}
             */
            moveToAndFocus: function (selector) {
                selectorsWithTitlesModified.push(selector);
                addShortcutsToTitle(selector);

                executor.add(function (e) {
                    var $elem = $(selector);
                    if ($elem.length > 0) {
                        $elem.focus();
                        if ($elem.moveTo) {
                            $elem.moveTo();
                        }
                        if ($elem.is(':input')) {
                            e.preventDefault();
                        }
                    }
                });
                return this;
            },

            /**
             * Binds additional keyboard controls
             *
             * @method or
             * @param {String} keys - keys to bind
             * @return {Object}
             */
            or: function (keys) {
                bindKeys(keys);
                return this;
            },

            /**
             * Adds a condition for whether the keyboard shortcut is enabled.
             *
             * @method if
             * @param {Function} predicate - a callback that returns true if the action can be executed
             * @return {Object}
             */
            'if': function (predicate) {
                predicates.push(predicate);
                return this;
            },

            /**
             * Adds a condition for whether the keyboard shortcut is disabled.
             *
             * @method ifnot
             * @param {Function} predicate - a callback that returns true if the action cannot be executed
             * @return {Object}
             */
            ifnot: function (predicate) {
                var inversePredicate = function () { return !predicate.apply(this, arguments); };
                predicates.push(inversePredicate);
                return this;
            },

            /**
             * Unbinds shortcut keys
             *
             * @method unbind
             */
            unbind: function () {
                $context
                    .off('keydown.whenitype keypress.whenitype', keypressHandler);

                for (var i = 0, len = selectorsWithTitlesModified.length; i < len; i++) {
                    removeShortcutsFromTitle(selectorsWithTitlesModified[i]);
                }
                selectorsWithTitlesModified = [];
            }
        };
    };

    // </AJS.WhenIType>

})(jQuery.fn, jQuery);