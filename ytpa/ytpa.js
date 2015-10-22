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
        $("#ytpa-graph-container").height($("#ytpa-graph-container").width());

        gapi.client.setApiKey(ytpa.config.appid);

        gapi.client.load('youtube', 'v3').then(function() {
            return ytpa.query.playlists('GameGrumps', 60);

        }).then(function(playlists) {
            console.log('Playlists for Game Grumps (' + playlists.length + '):');

            for(var playlistIdx in playlists)
                console.log(playlists[playlistIdx]);

        }).then(function() {
            return ytpa.query.uploads('GameGrumps', 60);

        }).then(function(uploads) {
            console.log('Uploads for Game Grumps (' + uploads.length + '):');

            for(var uploadIdx in uploads)
                console.log(uploads[uploadIdx]);

        }).then(function() {
            return ytpa.query.playlistVideoInfo('PLRQGRBgN_EnrnYydSvpPryrXOII-bJNMp');

        }).then(function(videos) {
            console.log('Information for Mario Galaxy playlist (' + videos.length + '):');

            var sortedVids = videos.sort(function(a,b){ return a.snippet.publishedAt > b.snippet.publishedAt ? 1 : -1 });

            for(var videosIdx in sortedVids)
                console.log(videos[videosIdx].snippet.title + ' has ' + videos[videosIdx].statistics.viewCount + ' views');
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );

// TODO(JRC): This line shouldn't be necessary, but the "onload" parameter for the
// Google client API will only work if the function is a global function.
var ytpa_init = ytpa.init;
