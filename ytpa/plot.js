/**
 * @file plot.js
 *
 * A library script that contains all of the functionality associated with
 * plotting data retrieved by the "ytpa" library.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.plot = ytpa.plot || {};

    ytpa.plot.init = function() {
        $("#ytpa-graph").height($("#ytpa-graph").width());

    };

}(window.ytpa = window.ytpa || {}, jQuery) );
