/**
 * @file storage.js
 *
 * A library script that contains a collection of basic library functions used
 * by the various components on the "ytpa" tool.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///
    ytpa.storage = ytpa.storage || {};
    var channelTitles = [];

    ytpa.storage.checkChannels = function(channelName) {
    	if ($.inArray(channelName, channelTitles) == -1) {
    		channelTitles.push(channelName);
    		return true;
    	}
    	return false;
    };

}(window.ytpa = window.ytpa || {}, jQuery) );