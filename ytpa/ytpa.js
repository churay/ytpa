/**
 * @file ytpa.js
 *
 * The main script for the "ytpa" application, which contains global bootstrapping
 * and configuration logic for the application.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    /**
     * The primary initialization function for the "ytpa" library.  This function
     * must be called before calling any other library functions.
     */
    ytpa.init = function() {
        gapi.client.setApiKey(ytpa.config.appid);

        gapi.client.load('youtube', 'v3').then(function() {
            return ytpa.query.playlistvideos('PLRQGRBgN_EnqD-KpeLv67tiP5myXmEG1b');
        }).then(function(videos) {
            ytpa.plot.playlist(videos);
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
