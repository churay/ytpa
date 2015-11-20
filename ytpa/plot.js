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
    ytpa.plot.opts.data = Object.freeze({VIEWS: 0, LIKES: 1, LIKE_RATIO: 2, COMMENTS: 3, AGG_VIEWS: 4});
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
        var chartData = new google.visualization.DataTable();
        chartData.addColumn('number', 'Video Number');
        for(var playlistID in ytpaPlottedPlaylists) {
            chartData.addColumn('number', ytpaLoadedPlaylists[playlistID].name);
            chartData.addColumn({type: 'string', role: 'tooltip', p: {'html': true}});
        }

        var maxPlaylistLength = Math.max.apply(Math, $.map(ytpaPlottedPlaylists,
            function(plBool, plID) { return ytpaLoadedPlaylists[plID].videos.length }));
        var agg_views = 0;
        for(var videoIdx = 0; videoIdx < maxPlaylistLength; ++videoIdx ) {
            var playlistVideoInfo = [videoIdx + 1];
            
            for(var playlistID in ytpaPlottedPlaylists) {
                var playlist = ytpaLoadedPlaylists[playlistID];

                var playlistVideoData = null;
                var playlistVideoTooltip = null;
                
                if(videoIdx < playlist.videos.length) {
                    var playlistVideo = playlist.videos[videoIdx];        
                    agg_views = agg_views + parseInt(playlistVideo.statistics.viewCount);
                    var statObj = {};

                    if(plotOptions.data == ytpa.plot.opts.data.VIEWS)
                        statObj = {Type: "View Count", Stat: parseInt(playlistVideo.statistics.viewCount)};
                    else if(plotOptions.data == ytpa.plot.opts.data.LIKES)
                        statObj = {Type: "Like Count", Stat: parseInt(playlistVideo.statistics.likeCount)};
                    else if(plotOptions.data == ytpa.plot.opts.data.LIKE_RATIO)
                        statObj = {Type: "Dislike Count", Stat: parseInt(playlistVideo.statistics.dislikeCount)};
                    else if(plotOptions.data == ytpa.plot.opts.data.COMMENTS)
                        statObj = {Type: "Comment Count", Stat: parseInt(playlistVideo.statistics.commentCount)};
                    else if(plotOptions.data == ytpa.plot.opts.data.AGG_VIEWS)
                        statObj = {Type: "Aggregate Views", Stat: parseInt(agg_views)};

                    playlistVideoTooltip = ytpaGenerateTooltipHtml(playlistVideo, videoIdx + 1, statObj);
                }

                playlistVideoInfo.push(statObj.Stat);
                playlistVideoInfo.push(playlistVideoTooltip);
            }

            chartData.addRow(playlistVideoInfo);
        }

        var chartOptions = {
            title: `Playlist Comparison for the "${$("#ytpa-channel").val()}" Channel`,
            tooltip: {isHtml: true},
            hAxis: {title: 'Video Number'},
            vAxis: {title: 'View Count'},
        };

        var chart = new google.visualization.LineChart(document.getElementById('ytpa-graph'));
        chart.draw(chartData, chartOptions);
    };

    /// Private Members ///

    /**
     * Generates and returns the HTML for given video's tooltip.
     */
    function ytpaGenerateTooltipHtml(video, videoIdx, statObj) {
        return `<div class="ytpa-video-tooltip"><p>
            <b>Part ${videoIdx}</b>: ${video.snippet.title}<br>
            <b>${statObj.Type}</b>: ${statObj.Stat}<br>
        </p></div>`;
    }

    /** A list of all of the playlists that are currently loaded. **/
    var ytpaLoadedPlaylists = {};

    /** A list of all of the playlists currently being plotted. **/
    var ytpaPlottedPlaylists = {};

}(window.ytpa = window.ytpa || {}, jQuery) );