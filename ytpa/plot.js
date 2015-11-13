/**
 * @file plot.js
 *
 * A library script that contains all of the functionality associated with
 * plotting data retrieved by the "ytpa" library.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.plot = ytpa.plot || {};

    /** An object containing all of the option enumerations for plotting. **/
    ytpa.plot.opts = {};
    /** An enumeration of all of the options for the data being displayed. **/
    ytpa.plot.opts.data = Object.freeze({VIEWS: 0, LIKES: 1, LIKE_RATIO: 2, COMMENTS: 3});
    /** An enumeration of all of the graph representation types. **/
    ytpa.plot.opts.repr = Object.freeze({SERIES: 0, COLLECTION: 1});
    /** An enumeration of all of the scale types that can be used for the graph. **/
    ytpa.plot.opts.scale = Object.freeze({INDEX: 0, RATIO: 1});

    /**
     * Adds the playlist (given as a list of videos) to the graph visualization.
     */
    ytpa.plot.playlists = function(playlistNames, playlistIDs, plotOptions) {
        var genPlaylistRequest = function(plname, plid) {
            return ytpa.query.playlistvideos(plid).then(function(videos) {
                return {id: plid, name: plname, videos: videos};
            });
        };

        ytpaPlottedPlaylists = {};
        var playlistRequests = [];
        for(var playlistIdx in playlistNames) {
            var playlistName = playlistNames[playlistIdx];
            var playlistID = playlistIDs[playlistIdx];

            ytpaPlottedPlaylists[playlistID] = true;
            if(!(playlistID in ytpaLoadedPlaylists))
                playlistRequests.push(genPlaylistRequest(playlistName, playlistID));
        }

        return Promise.all(playlistRequests).then(function(playlists) {
            for(var playlistIdx in playlists) {
                var playlist = playlists[playlistIdx];
                ytpaLoadedPlaylists[playlist.id] = playlist;
            }

            ytpa.plot.draw(plotOptions);
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
    ytpa.plot.draw = function(plotOptions) {
        var playlistChartDataList = [];

        for(var playlistID in ytpaPlottedPlaylists) {
            var playlist = ytpaLoadedPlaylists[playlistID];

            var playlistChartData = new google.visualization.DataTable();
            playlistChartData.addColumn('number', 'Video Scaled Index');
            playlistChartData.addColumn('number', playlist.name);
            playlistChartData.addColumn({type: 'string', role: 'tooltip', p: {'html': true}});

            for(var videoID in playlist.videos) {
                var videoIdx = parseInt(videoID);
                var playlistVideo = playlist.videos[videoID];

                var videoStatistic = parseInt(playlistVideo.statistics.viewCount);
                var videoScaledIdx = ( plotOptions.scale == ytpa.plot.opts.scale.INDEX ) ?
                    videoIdx : videoIdx / ( playlist.videos.length - 1 );
                var videoTooltip = ytpaGenerateTooltipHtml(playlistVideo, videoIdx + 1);

                playlistChartData.addRow([videoScaledIdx, videoStatistic, videoTooltip]);
            }

            playlistChartDataList.push(playlistChartData);
        }

        var chartData = playlistChartDataList.pop();
        for(var playlistIdx in playlistChartDataList)
            chartData = google.visualization.data.join(chartData,
                playlistChartDataList[playlistIdx], 'full', [[0, 0]],
                ytpa.lib.range(1, chartData.getNumberOfColumns()), [1, 2]);

        var chartOptions = {
            title: `Playlist Comparison for the "${$("#ytpa-channel").val()}" Channel`,
            hAxis: {title: 'Video Number'},
            vAxis: {title: 'View Count'},
            tooltip: {isHtml: true},
            interpolateNulls: plotOptions.scale == ytpa.plot.opts.scale.RATIO,
        };

        var chart = new google.visualization.LineChart(document.getElementById('ytpa-graph'));
        chart.draw(chartData, chartOptions);
    };

    /// Private Members ///

    /**
     * Generates and returns the HTML for given video's tooltip.
     */
    function ytpaGenerateTooltipHtml(video, videoIdx) {
        return `<div class="ytpa-video-tooltip"><p>
            <b>Part ${videoIdx}</b>: ${video.snippet.title}<br>
            <b>Views</b>: ${video.statistics.viewCount}<br>
        </p></div>`;
    }

    /** A list of all of the playlists that are currently loaded. **/
    var ytpaLoadedPlaylists = {};

    /** A list of all of the playlists currently being plotted. **/
    var ytpaPlottedPlaylists = {};

}(window.ytpa = window.ytpa || {}, jQuery) );
