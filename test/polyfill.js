/**
 * This is a polyfill to add the ES6 Object.assign functionality
 * to older browsers.
 * --
 * Object.assign allows us to clone objects without including a
 * third-party library like Underscore or jQuery.
 *
 * Cloning prevents our source object from being modified
 * when we save and generate ids. The desired behavior is for
 * a new object reflecting our saved instance being returned
 * from a collection.save() rather than the original object
 * being updated as this may cause confusion to those not
 * familiar with the JavaScript pass-by-reference behavior.
 *
 * Disclaimer: I did not write this Polyfill.
 */
if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function (target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert first argument to object');
            }

            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource === undefined || nextSource === null) {
                    continue;
                }
                nextSource = Object(nextSource);

                var keysArray = Object.keys(nextSource);
                for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                    var nextKey = keysArray[nextIndex];
                    var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        }
    });
}