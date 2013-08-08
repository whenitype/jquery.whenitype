(function() {
	"use strict";

	var testResults = [];

	module("WhenIType Keyboard Shortcuts Unit Tests", {
		setup: function () {
			$(document).off("keyup keydown keypress keyup.whenitype keydown.whenitype keypress.whenitype");
			testResults = [];
		},
		teardown: function () {
		}
	});

	var KEYS = { META: 224, ALT: 18, CTRL: 17 };

	test("emacs", function () {
		// Shortcut keys shouldn't overlap, so testing abc and abcd together should have undefined results.
		var combinations = ["abc", "dcba", "zzz", "p", "zabcdefghijklmnopqrstuwxy",
			// printable special keys should also be tested through the charCode code path
			"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ",", ".", "/", "[", "]", "-"];

		$.each(combinations, function (idx, str) {
			$(document).whenIType(str).execute(function () {
				testResults[idx] = true;
			});

			$.each(str.split(""), function (i) {
				var event = $.Event("keypress");
				event.which = str.charCodeAt(i);
				$(document).trigger(event);
				if (i !== str.length - 1) {
					ok(!testResults[idx], "Keyboard combination '" + str + "' should not execute function until full string is "
							+ "typed, not on letter '" + str.charAt(i) + "' (index: " + i + ")");
				}
			});
			ok(testResults[idx], "emacs: - Expected keyboard combination '" + str + "' to execute function");
		});
	});

	test("special keys", function () {

		// We include a specifically unprintable character in these tests (left) to force whenIType to use the keydown event.
		// This is so we are testing the keyCode of the special and not the charCode.
		// For example:
		//   Typing the numpad '0' generates a keydown event with e.which === 96 (keyCode) and
		//   a keypress event with e.which === 48 (charCode)
		// The normal characters are tested via keypress in the emacs test.

		var specialKeys = {
			8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
			20: "capslock", 27: "esc",
			//32: "space",
			33: "pageup", 34: "pagedown", 35: "end", 36: "home",
			37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
			//96: "0", 97: "1", 98: "2", 91: "meta", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
			//104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111: "/",
			112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
			120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll",
			//188: ",", 190: ".", 191: "/", 224: "meta", 219: '[', 221: ']'
		};

		var forceKeydownKey = "left",
			forceKeydownKeycode = 37;

		// since we're not unbinding, each occurrance will trigger multiple shortcuts.
		// first only 1 is bound, then 2 are bound (3 hits total), then 3 are bound (6 hits total)...
		function custom(retArray, then) {
			return function () {
				return retArray.length ? retArray.shift() : then;
			};
		}
		//these appear twice in the specials.
		var expectedCounts = {
			'.': custom([1, 3], 3),
			'/': custom([1, 3], 3),
			'meta': custom([1, 3], 3)
		};
		var defaultCount = function () { return 1; };

		$.each(specialKeys, function (keyCode, name) {
			$(document).whenIType(name).execute(function() {
				testResults[name] = (testResults.hasOwnProperty(name) ? testResults[name] : 0) + 1;
			});

			var event = $.Event("keydown");
			event.which = forceKeydownKeycode;
			$(document).trigger(event);

			var event = $.Event("keyup");
			event.which = forceKeydownKeycode;
			$(document).trigger(event);

			var event = $.Event("keydown");
			event.which = keyCode;
			$(document).trigger(event);

			var event = $.Event("keyup");
			event.which = keyCode;
			$(document).trigger(event);

			var numExpected = (expectedCounts.hasOwnProperty(name) ? expectedCounts[name] : defaultCount)();
			if (name == forceKeydownKey) {
				numExpected++;
			}
			equal(testResults[name], numExpected, "specials: Expected keyboard combination '" + name + "' to execute function " + numExpected + " times so far.");
		});
	});

	test("shift keys", function () {

		var shiftNums = {
			"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
			"8": "*", "9": "(", "0": ")", "-": "_", "=": "+",
			//";": ":",
			"'": "\"", ",": "<",
			".": ">", "/": "?", "\\": "|"
		};

		$.each(shiftNums, function (shiftChar, name) {
			$(document).whenIType(name).execute(function () {
				testResults[name] = true;
			});

			var event = $.Event("keypress");
			event.which = shiftChar.charCodeAt(0);
			event.shiftKey = true;
			$(document).trigger(event);

			ok(testResults[name], "shift: Expected keyboard combination '" + name + "' to execute function");
		});

	});

	test("modifier keys", function () {

		var combinations = ["ctrl+c", "ctrl+a", "alt+a", "meta+?", "ctrl+?"];
		expect(combinations.length);

		$.each(combinations, function (index, keyCombo) {
			$(document).whenIType(keyCombo).execute(function () {
				testResults[keyCombo] = true;
			});

			var event = $.Event("keydown");
			var combination = keyCombo;
			while (combination.indexOf("+") !== -1) {
				var modifier = combination.substring(0, combination.indexOf("+"));
				event[modifier + "Key"] = true;
				combination = combination.replace(modifier + "+", "");
			}
			event.which = combination.charCodeAt(0);
			$(document).trigger(event);

			ok(testResults[keyCombo], "modifiers: Expected keyboard combination '" + keyCombo + "' to execute function");
		});
	});

	var called;
	function makeModifierTest(modifier) {
		return function () {
			var combinations = ["c", "?", "a"];
			var event;

			expect(combinations.length);

			$.each(combinations, function (index, key) {
				called = false;
				$(document).whenIType(key).execute(function () {
					called = true;
				});

				event = $.Event("keypress");
				event[modifier + 'Key'] = true;
				event.which = key.charCodeAt(0);
				$(document).trigger(event);

				ok(!called, 'The key ' + key + ' should not have fired an event');
			});
		}
	}

	test("keys pressed with ctrl modifier should not execute", makeModifierTest('ctrl'));
	test("keys pressed with alt modifier should not execute", makeModifierTest('alt'));
	test("keys pressed with meta modifier should not execute", makeModifierTest('meta'));

	test("multiple handlers bound", function () {

		var event,
			triggerCount = 0,
			incrementTrigger = function () {
				triggerCount++;
			},
			shortcut = $(document).whenIType("a").execute(incrementTrigger).execute(incrementTrigger);

		event = $.Event("keypress");
		event.which = "65";
		$(document).trigger(event);
		strictEqual(triggerCount, 2, "Keypress should have fired 2 handlers");
	});

	test("unbinding shortcuts", function () {

		var originalTitle = "Some title () ) (";
		var shortcutsInTitle = ' (Type "x" OR "a")';

		var $testDiv1 = $('<div class="test-one" title="Some title () ) ("/>');
		var $testDiv2 = $('<div class="test-two" title="Some title () ) ("/>');

		$("#qunit-fixture").append($testDiv1).append($testDiv2);

		var event,
			triggerCount = 0,
			shortcut = $(document).whenIType("x").or("a").execute(function () {
				triggerCount++;
			}).click('.test-one');

		strictEqual($testDiv1.attr('title'), originalTitle + shortcutsInTitle, 'Title on test-one should have been appended to.');
		strictEqual($testDiv2.attr('title'), originalTitle, 'Title on test-two should have been unchanged.');

		event = $.Event("keypress");
		event.which = "65";
		$(document).trigger(event);
		strictEqual(triggerCount, 1, 'Key should have been fired once');

		shortcut.unbind();
		$(document).trigger(event);
		strictEqual(triggerCount, 1, 'Key should not have been fired a second time');

		strictEqual($testDiv1.attr('title'), originalTitle, 'Title on test-one should have been reverted.');
		strictEqual($testDiv2.attr('title'), originalTitle, 'Title on test-two should have been unchanged.');
	});


	test("conditional shortcut", function () {
		var event,
			triggerCount = 0,
			incrementTrigger = function () {
				triggerCount++;
			},
			isAllowed = false,
			shortcut = $(document).whenIType("a").if(function () { return isAllowed; }).execute(incrementTrigger);

		event = $.Event("keypress");
		event.which = "65";
		$(document).trigger(event);
		strictEqual(triggerCount, 0, "Keypress should have fired 0 handlers");

		// Now switch allowed to true and it should fire this time 
		isAllowed = true;

		$(document).trigger(event);
		strictEqual(triggerCount, 1, "Keypress should have fired 1 handlers");
	});

	test("multiple conditional shortcut", function () {

		var event,
			triggerCount = 0,
			incrementTrigger = function () {
				triggerCount++;
			},
			isAllowed1 = false,
			isAllowed2 = false,
			shortcut = $(document)
				.whenIType("a")
				.if(function () { return isAllowed1; })
				.if(function () { return isAllowed2; })
				.execute(incrementTrigger);

		event = $.Event("keypress");
		event.which = "65";
		$(document).trigger(event);
		strictEqual(triggerCount, 0, "Keypress should have fired 0 handlers");

		isAllowed1 = true;
		$(document).trigger(event);
		strictEqual(triggerCount, 0, "Keypress should have fired 0 handlers");

		isAllowed2 = true;
		$(document).trigger(event);
		strictEqual(triggerCount, 1, "Keypress should have fired 1 handlers");
	});

	test("inverse conditional shortcut", function () {
		var event,
			triggerCount = 0,
			incrementTrigger = function () {
				triggerCount++;
			},
			isForbidden = true,
			shortcut = $(document).whenIType("a").ifnot(function () { return isForbidden; }).execute(incrementTrigger);

		event = $.Event("keypress");
		event.which = "65";
		$(document).trigger(event);
		strictEqual(triggerCount, 0, "Keypress should have fired 0 handlers");

		// Now switch allowed to true and it should fire this time 
		isForbidden = false;

		$(document).trigger(event);
		strictEqual(triggerCount, 1, "Keypress should have fired 1 handlers");
	});

	test("multiple conditional and inverse conditional shortcut", function () {

		var event,
			triggerCount = 0,
			incrementTrigger = function () {
				triggerCount++;
			},
			isAllowed1 = false,
			isForbidden1 = true,
			isAllowed2 = false,
			shortcut = $(document)
				.whenIType("a")
				.if(function () { return isAllowed1; })
				.ifnot(function () { return isForbidden1; })
				.if(function () { return isAllowed2; })
				.execute(incrementTrigger);

		event = $.Event("keypress");
		event.which = "65";
		$(document).trigger(event);
		strictEqual(triggerCount, 0, "Keypress should have fired 0 handlers");

		isAllowed1 = true;
		$(document).trigger(event);
		strictEqual(triggerCount, 0, "Keypress should have fired 0 handlers");

		isForbidden1 = false;
		$(document).trigger(event);
		strictEqual(triggerCount, 0, "Keypress should have fired 0 handlers");

		isAllowed2 = true;
		$(document).trigger(event);
		strictEqual(triggerCount, 1, "Keypress should have fired 1 handlers");
	});
})();