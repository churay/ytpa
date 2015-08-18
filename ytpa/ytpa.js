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

        gapi.client.load('youtube', 'v3', function() {
            ytpa.query.processUploads('GameGrumps', function(uploads) {
                for(var uploadIdx in uploads)
                    console.log(uploads[uploadIdx]);
            } );
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );

// TODO(JRC): This line shouldn't be necessary, but the "onload" parameter for the
// Google client API will only work if the function is a global function.
var ytpa_init = ytpa.init;
