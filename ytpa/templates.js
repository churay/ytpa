/**
 * @file templates.js
 *
 * An auxiliary script that contains all of the template strings used in the
 * "ytpa" tool.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.templates = ytpa.templates || {};

    /** The string template for formal reddit comment displays. */
    ytpa.templates.redditcomment = `
        <div class="well well-sm" style="width:{8}px">
            <p class="text-left"><strong>{0}</strong> <small>[{1} points]</small></p>
            <p class="test-left md"><em>{3}</em></p>
            <p class="text-right">From <a href="{4}">{5}</a> on <a href="{6}">{7}</a></p>
        </div>`;

}(window.ytpa = window.ytpa || {}, jQuery) );
