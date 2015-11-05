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
    ytpa.plot.playlists = function(playlistNames, playlistIDs) {
        ytpaPlottedPlaylists = {};

        var playlistRequests = [];
        for(var playlistIdx in playlistNames) {
            var playlistName = playlistNames[playlistIdx];
            var playlistID = playlistIDs[playlistIdx];

            ytpaPlottedPlaylists[playlistID] = true;
            if(!(playlistName in ytpaLoadedPlaylists)) {
                playlistRequests.push(
                    ytpa.query.playlistvideos(playlistID).then(function(videos) {
                        return {id: playlistID, name: playlistName, videos: videos};
                    })
                );
            }
        }

        return Promise.all(playlistRequests).then(function(playlists) {
            for(var playlistIdx in playlists) {
                var playlist = playlists[playlistIdx];
                ytpaLoadedPlaylists[playlist.id] = playlist;
            }

            ytpa.plot.draw();
        });
    };

    /**
     * Clears all of the active playlist lines from the graph visualization.
     */
    ytpa.plot.clear = function() {
        ytpaLoadedPlaylists = {};
        ytpaPlottedPlaylists = {};
    };

    /**
     * Redraws the graph visualization with all of the playlist data given.
     */
    ytpa.plot.draw = function() {
        var chartData = new google.visualization.DataTable();
        chartData.addColumn('number', 'Video Number');
        for(var playlistID in ytpaPlottedPlaylists)
            chartData.addColumn('number', ytpaLoadedPlaylists[playlistID].name);

        var maxPlaylistLength = Math.max.apply(Math, $.map(ytpaPlottedPlaylists,
            function(plBool, plID) { return ytpaLoadedPlaylists[plID].videos.length }));
        for(var videoIdx = 0; videoIdx < maxPlaylistLength; ++videoIdx ) {
            var playlistViewCounts = [videoIdx + 1];
            for(var playlistID in ytpaPlottedPlaylists) {
                var playlist = ytpaLoadedPlaylists[playlistID];
                var playlistVideoViewCount = (videoIdx < playlist.videos.length) ?
                    parseInt(playlist.videos[videoIdx].statistics.viewCount) : null;

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

    /** A list of all of the playlists that are currently loaded. **/
    var ytpaLoadedPlaylists = {};

    /** A list of all of the playlists currently being plotted. **/
    var ytpaPlottedPlaylists = {};

}(window.ytpa = window.ytpa || {}, jQuery) );
