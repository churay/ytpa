/**
 * @file reddit
 *
 * Temp Description
 */

( function(ytpa, $, undefined) {
    /// Public Members ///
    ytpa.reddit = ytpa.reddit || {};

    var root_url = "https://www.reddit.com";

    ytpa.reddit.search = function(query) {
        reddit.search(query).t('all').limit(1).sort("top").fetch(function(res) {
            console.log(root_url + res.data.children[0].data.permalink);
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
