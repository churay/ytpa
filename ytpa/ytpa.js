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
            return ytpa.query.playlists('GameGrumps', 60);

        }).then(function(playlists) {
            console.log('Playlists for Game Grumps (' + playlists.length + '):');

            for(var playlistIdx in playlists)
                console.log(playlists[playlistIdx].id, playlists[playlistIdx].snippet.title);

        }).then(function() {
            return ytpa.query.playlistvideos('PLRQGRBgN_EnqD-KpeLv67tiP5myXmEG1b');

        }).then(function(videos) {
            // TODO(JRC): Move this functionality to the "plot.js" script and create
            // a double dependency in this script on the "YouTube" API and
            // the "Charts" API.
            var chartRawData = videos.map(function(video, videoIdx) {
                return [parseInt(videoIdx) + 1, parseInt(video.statistics.viewCount)];
            });
            chartRawData.unshift(["View Count", "Pokemon FireRed"]);

            var chartData = google.visualization.arrayToDataTable(chartRawData);
            var chartOptions = {
                hAxis: {title: "Video Number"},
                vAxis: {title: "View Count"},
            };

            var chart = new google.visualization.LineChart(document.getElementById("ytpa-graph"));
            chart.draw(chartData, chartOptions);
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );

// TODO(JRC): This line shouldn't be necessary, but the "onload" parameter for the
// Google client API will only work if the function is a global function.
var ytpa_init = ytpa.init;
