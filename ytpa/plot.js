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
    ytpa.plot.opts.data = Object.freeze({VIEWS: 0, AGG_VIEWS: 1, LIKE_RATIO: 2,
        LIKES_NORM: 3, DISLIKES_NORM: 4, COMMENTS_NORM: 5, PARTICIPATION_NORM: 6,
        props: {0: {name: 'Views', value: 0}, 1: {name: 'Aggregate Views', value: 1},
        2: {name: 'Likes/Dislike Ratio', value: 2}, 3: {name: 'View-Normalized Likes', value: 3},
        4: {name: 'View-Normalized Dislikes', value: 4}, 5: {name: 'View-Normalized Comments', value: 5},
        6: {name: 'View-Normalized Participation', value: 6},}});
    /** An enumeration of all of the graph representation types. **/
    ytpa.plot.opts.repr = Object.freeze({SERIES: 0, COLLECTION: 1,
        props: {0: {name: 'Series', value: 0}, 1: {name: 'Collection', value: 1}}});
    /** An enumeration of all of the scale types that can be used for the graph. **/
    ytpa.plot.opts.scale = Object.freeze({INDEX: 0, RATIO: 1,
        props: {0: {name: 'Index', value: 0}, 1: {name: 'Ratio', value: 1}}});

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
            var playlistLength = playlist.videos.length;

            var playlistChartData = new google.visualization.DataTable();
            playlistChartData.addColumn('number', 'Video Scaled Index');
            playlistChartData.addColumn('number', playlist.name);
            playlistChartData.addColumn({type: 'string', role: 'tooltip', p: {'html': true}});

            for(var videoID in playlist.videos) {
                var videoIdx = parseInt(videoID);
                var playlistVideo = playlist.videos[videoID];

                // TODO(JRC): Move this code to a location that's closer to the
                // acquisition of this data.
                if(playlistVideo.statistics.aggViewCount === undefined) {
                    var prevAggViewCount = (videoIdx === 0) ? 0 :
                        playlist.videos[(videoIdx-1).toString()].statistics.aggViewCount;
                    playlistVideo.statistics.aggViewCount = prevAggViewCount +
                        parseInt(playlistVideo.statistics.viewCount);
                }

                playlistChartData.addRow([
                    ytpaGetVideoIndex(videoIdx, playlistLength, plotOptions.scale),
                    ytpaGetVideoStatistic(playlistVideo, plotOptions.data),
                    ytpaGenerateTooltipHtml(playlistVideo, videoIdx + 1, plotOptions.data),
                ]);
            }

            playlistChartDataList.push(playlistChartData);
        }

        var chartData = (playlistChartDataList.length > 0) ? playlistChartDataList.pop() :
            google.visualization.arrayToDataTable([['', {role: 'annotation'}], ['', '']]);
        for(var playlistIdx in playlistChartDataList)
            chartData = google.visualization.data.join(chartData,
                playlistChartDataList[playlistIdx], 'full', [[0, 0]],
                ytpa.lib.range(1, chartData.getNumberOfColumns()), [1, 2]);

        var chartOptions = {
            title: `Playlist Comparison for the "${$("#ytpa-channel").val()}" Channel`,
            hAxis: {title: `Playlist ${ytpa.plot.opts.scale.props[plotOptions.scale].name}`},
            vAxis: {title: `${ytpa.plot.opts.data.props[plotOptions.data].name}`},
            tooltip: {isHtml: true},
            interpolateNulls: plotOptions.scale == ytpa.plot.opts.scale.RATIO,
        };

        var chart = new google.visualization.LineChart(document.getElementById('ytpa-graph'));
        chart.draw(chartData, chartOptions);
    };

    /// Private Members ///

    /**
     * Generates and returns the video statistic for the given video given the
     * video information and the statistic option that will be applied.
     */
    function ytpaGetVideoStatistic(video, dataOpt) {
        var viewCount = parseInt(video.statistics.viewCount);
        var aggViewCount = parseInt(video.statistics.aggViewCount);
        var likeCount = parseInt(video.statistics.likeCount);
        var dislikeCount = parseInt(video.statistics.dislikeCount);
        var commentCount = parseInt(video.statistics.commentCount);

        if(dataOpt == ytpa.plot.opts.data.VIEWS) {
            return viewCount;
        } else if(dataOpt == ytpa.plot.opts.data.AGG_VIEWS) {
            return aggViewCount;
        } else if(dataOpt == ytpa.plot.opts.data.LIKE_RATIO) {
            return likeCount / (likeCount + dislikeCount);
        } else if(dataOpt == ytpa.plot.opts.data.LIKES_NORM) {
            return likeCount / viewCount;
        } else if(dataOpt == ytpa.plot.opts.data.DISLIKES_NORM) {
            return dislikeCount / viewCount;
        } else if(dataOpt == ytpa.plot.opts.data.COMMENTS_NORM) {
            return commentCount / viewCount;
        } else if(dataOpt == ytpa.plot.opts.data.PARTICIPATION_NORM) {
            return (commentCount + likeCount + dislikeCount) / viewCount;
        } else {
            throw new RangeError("Given video statistic option is invalid.");
        }
    }

    /**
     * Generates and returns the video index for the given video given the
     * video information and the scaling option that will be applied.
     */
    function ytpaGetVideoIndex(videoIndex, videoPlaylistLength, scaleOpt) {
        if(scaleOpt == ytpa.plot.opts.scale.INDEX) {
            return videoIndex;
        } else if(scaleOpt == ytpa.plot.opts.scale.RATIO) {
            return videoIndex / ( videoPlaylistLength - 1 );
        } else {
            throw new RangeError("Given scaling option is invalid.");
        }
    }

    /**
     * Generates and returns the HTML for given video's tooltip.
     */
    function ytpaGenerateTooltipHtml(video, videoIdx, dataOpt) {
        return `<div class="ytpa-video-tooltip"><p>
            <b>Part ${videoIdx}</b>: ${video.snippet.title}<br>
            <b>${ytpa.plot.opts.data.props[dataOpt].name}</b>:
            ${ytpaGetVideoStatistic(video, dataOpt)}<br>
        </p></div>`;
    }

    /** A list of all of the playlists that are currently loaded. **/
    var ytpaLoadedPlaylists = {};

    /** A list of all of the playlists currently being plotted. **/
    var ytpaPlottedPlaylists = {};

}(window.ytpa = window.ytpa || {}, jQuery) );
