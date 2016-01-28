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
    ytpa.plot.opts.data = Object.freeze({VIEWS: 0, LIKE_RATIO: 1, LIKES_NORM: 2,
        DISLIKES_NORM: 3, COMMENTS_NORM: 4, PARTICIPATION_NORM: 5,
        props: {0: {name: 'Views', value: 0}, 1: {name: 'Likes/Dislike Ratio', value: 1},
        2: {name: 'View-Normalized Likes', value: 2}, 3: {name: 'View-Normalized Dislikes', value: 3},
        4: {name: 'View-Normalized Comments', value: 4}, 5: {name: 'View-Normalized Participation', value: 5}}});
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
        var playlistSort = ytpaGetPlaylistSortFunction(plotOptions);

        var playlistChartDataList = [];
        for(var playlistID in ytpaPlottedPlaylists) {
            var playlist = ytpaLoadedPlaylists[playlistID];
            var playlistLength = playlist.videos.length;
            var playlistVideos = playlist.videos.sort(playlistSort);

            var playlistChartData = new google.visualization.DataTable();
            playlistChartData.addColumn('number', 'Video Scaled Index');
            playlistChartData.addColumn('number', playlist.name);
            playlistChartData.addColumn({type: 'string', role: 'tooltip', p: {'html': true}});

            for(var videoIdx in playlistVideos) {
                var videoIdx = parseInt(videoIdx);
                var playlistVideo = playlist.videos[videoIdx];

                playlistChartData.addRow([
                    ytpaGetVideoIndex(videoIdx, playlistLength, plotOptions),
                    ytpaGetVideoStatistic(playlistVideo, plotOptions),
                    ytpaGenerateTooltipHtml(playlistVideo, videoIdx, plotOptions),
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
            hAxis: {
                title: `Playlist ${ytpa.plot.opts.scale.props[plotOptions.scale].name}`,
                baselineColor: '#000000',
                minValue: 1,
            },
            vAxis: {
                title: `${ytpa.plot.opts.data.props[plotOptions.data].name}`,
                baselineColor: '#000000',
            },
            explorer: {axis: 'horizontal', maxZoomOut: 1, keepInBounds: true},
            tooltip: {isHtml: true},
            interpolateNulls: plotOptions.scale == ytpa.plot.opts.scale.RATIO,
        };

        var chartType = (plotOptions.repr == ytpa.plot.opts.repr.SERIES) ?
            google.visualization.LineChart : google.visualization.ColumnChart;
        var chart = new chartType(document.getElementById('ytpa-graph'));
        chart.draw(chartData, chartOptions);
    };

    /// Private Members ///

    /**
     * Generates and returns the function that sorts the a playlist's videos
     * for the given representation option.
     */
    function ytpaGetPlaylistSortFunction(plotOptions) {
        if(plotOptions.repr == ytpa.plot.opts.repr.SERIES) {
            return function(v1, v2) {
                return (v1.snippet.publishedAt > v2.snippet.publishedAt) ? 1 : -1;
            };
        } else if(plotOptions.repr == ytpa.plot.opts.repr.COLLECTION) {
            return function(v1, v2) {
                return ytpaGetVideoStatistic(v2, plotOptions) - ytpaGetVideoStatistic(v1, plotOptions);
            };
        } else {
            throw new RangeError("Given playlist representation option is invalid.");
        }
    }

    /**
     * Generates and returns the video statistic for the given video given the
     * video information and the statistic option that will be applied.
     */
    function ytpaGetVideoStatistic(video, plotOptions) {
        var viewCount = parseInt(video.statistics.viewCount);
        var likeCount = parseInt(video.statistics.likeCount);
        var dislikeCount = parseInt(video.statistics.dislikeCount);
        var commentCount = parseInt(video.statistics.commentCount);

        if(plotOptions.data == ytpa.plot.opts.data.VIEWS) {
            return viewCount;
        } else if(plotOptions.data == ytpa.plot.opts.data.LIKE_RATIO) {
            return likeCount / (likeCount + dislikeCount);
        } else if(plotOptions.data == ytpa.plot.opts.data.LIKES_NORM) {
            return likeCount / viewCount;
        } else if(plotOptions.data == ytpa.plot.opts.data.DISLIKES_NORM) {
            return dislikeCount / viewCount;
        } else if(plotOptions.data == ytpa.plot.opts.data.COMMENTS_NORM) {
            return commentCount / viewCount;
        } else if(plotOptions.data == ytpa.plot.opts.data.PARTICIPATION_NORM) {
            return (commentCount + likeCount + dislikeCount) / viewCount;
        } else {
            throw new RangeError("Given video statistic option is invalid.");
        }
    }

    /**
     * Generates and returns the video index for the given video given the
     * video information and the scaling option that will be applied.
     */
    function ytpaGetVideoIndex(videoIndex, videoPlaylistLength, plotOptions) {
        if(plotOptions.scale == ytpa.plot.opts.scale.INDEX) {
            return videoIndex + 1;
        } else if(plotOptions.scale == ytpa.plot.opts.scale.RATIO) {
            return videoIndex / ( videoPlaylistLength - 1 );
        } else {
            throw new RangeError("Given scaling option is invalid.");
        }
    }

    /**
     * Generates and returns the HTML for given video's tooltip.
     */
    function ytpaGenerateTooltipHtml(video, videoIdx, plotOptions) {
        return `<div class="ytpa-video-tooltip"><p>
            <b>Part ${videoIdx + 1}</b>: ${video.snippet.title}<br>
            <b>${ytpa.plot.opts.data.props[plotOptions.data].name}</b>:
            ${ytpaGetVideoStatistic(video, plotOptions)}<br>
            <b>hi</b>
        </p></div>`;
    }

    /** A list of all of the playlists that are currently loaded. **/
    var ytpaLoadedPlaylists = {};

    /** A list of all of the playlists currently being plotted. **/
    var ytpaPlottedPlaylists = {};

}(window.ytpa = window.ytpa || {}, jQuery) );
