/**
 * @file plot.js
 *
 * A library script that contains all of the functionality associated with
 * plotting data retrieved by the "ytpa" library.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.plot = ytpa.plot || {};

    /**
     * Adds the playlist (given as a list of videos) to the graph visualization.
     */
    ytpa.plot.playlist = function(playlistName, playlistVideos) {
        if(!(playlistName in ytpaPlottedPlaylists)) {
            ytpaPlottedPlaylists[playlistName] = playlistVideos;
            ytpa.plot.draw();
        }
    };

    /**
     * Clears all of the active playlist lines from the graph visualization.
     */
    ytpa.plot.clear = function() {
        ytpaPlottedPlaylists = {};
    };

    /**
     * Redraws the graph visualization with all of the playlist data given.
     */
    ytpa.plot.draw = function() {
        var chartData = new google.visualization.DataTable();
        chartData.addColumn('number', 'Video Number');
        for(var playlistName in ytpaPlottedPlaylists)
            chartData.addColumn('number', playlistName);

        var maxPlaylistLength = Math.max.apply(Math, $.map(ytpaPlottedPlaylists,
            function(playlistVideos, playlistName) { return playlistVideos.length }));
        for(var videoIdx = 0; videoIdx < maxPlaylistLength; ++videoIdx ) {
            var playlistViewCounts = [videoIdx + 1];
            for(var playlistName in ytpaPlottedPlaylists) {
                var playlistVideos = ytpaPlottedPlaylists[playlistName];
                var playlistVideoViewCount = (videoIdx < playlistVideos.length) ?
                    parseInt(playlistVideos[videoIdx].statistics.viewCount) : null;

                playlistViewCounts.push(playlistVideoViewCount);
            }

            chartData.addRow(playlistViewCounts);
        }

        var chartOptions = {
            title: 'Playlist Comparison for ' + $("#ytpa-channel").val(),
            hAxis: {title: 'Video Number'},
            vAxis: {title: 'View Count'},
        };

        var chart = new google.visualization.LineChart(document.getElementById('ytpa-graph'));
        chart.draw(chartData, chartOptions);
    };

    /// Private Members ///

    /** A list of all of the playlists currently being plotted. **/
    var ytpaPlottedPlaylists = {};

}(window.ytpa = window.ytpa || {}, jQuery) );
