/**
 * @file lib.js
 *
 * A library script that contains a collection of basic library functions used
 * by the various components on the "ytpa" tool.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.lib = ytpa.lib || {};

    /**
     * Clamps the first value to the (min, max) range defined by the second and third values.
     */
    ytpa.lib.clamp = function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
