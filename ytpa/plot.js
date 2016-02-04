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
    /** An enumeration of all of the graph representation types. **/
    ytpa.plot.opts.type = Object.freeze({SERIES: 0, COLLECTION: 1, AGGREGATE: 2,
        props: {0: {name: 'Series', value: 0}, 1: {name: 'Collection', value: 1},
        2: {name: 'Aggregate', value: 2}}});
    /** An enumeration of all of the options for the data being displayed. **/
    ytpa.plot.opts.data = Object.freeze({VIEWS: 0, LIKE_RATIO: 1, LIKES_NORM: 2,
        DISLIKES_NORM: 3, COMMENTS_NORM: 4, PARTICIPATION_NORM: 5,
        props: {0: {name: 'Views', value: 0}, 1: {name: 'Likes/Dislike Ratio', value: 1},
        2: {name: 'View-Normalized Likes', value: 2}, 3: {name: 'View-Normalized Dislikes', value: 3},
        4: {name: 'View-Normalized Comments', value: 4}, 5: {name: 'View-Normalized Participation', value: 5}}});
    /** An enumeration of all of the scale types that can be used for the graph. **/
    ytpa.plot.opts.scale = Object.freeze({INDEX: 0, RATIO: 1,
        props: {0: {name: 'Index', value: 0}, 1: {name: 'Ratio', value: 1}}});
    /** An enumeration of all of the grouping functions that can be used. **/
    ytpa.plot.opts.group = Object.freeze({SUM: 0, AVERAGE: 1,
        props: {0: {name: 'Sum', value: 0}, 1: {name: 'Average', value: 1}}});

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
        var playlistSortDesc = plotOptions.type == ytpa.plot.opts.type.COLLECTION;
        var playlistSortCol = playlistSortDesc ? 1 : 0;

        var channelName = $("#ytpa-channel").val();

        var playlistChartDataList = [];
        for(var playlistID in ytpaPlottedPlaylists) {
            var playlist = ytpaLoadedPlaylists[playlistID];
            var playlistLength = playlist.videos.length;

            var playlistChartData = new google.visualization.DataTable();
            playlistChartData.addColumn('number', 'Video Index');
            playlistChartData.addColumn('number', playlist.name);
            playlistChartData.addColumn({type: 'string', role: 'tooltip', p: {'html': true}});
            playlistChartData.addColumn('string', 'Playlist');
            playlistChartData.addColumn('string', 'Title');

            for(var videoIdx in playlist.videos) {
                var video = playlist.videos[videoIdx];
                var videoId = video.id;
                var videoNumber = parseInt(videoIdx) + 1;
                var videoTitle = video.snippet.title;
                var videoStat = ytpaGetVideoStatistic(video, plotOptions);

                playlistChartData.addRow([videoNumber, videoStat, null,
                    playlist.name, videoTitle]);
            }

            playlistChartData.sort({column: playlistSortCol, desc: playlistSortDesc});
            for(var videoRow = 0; videoRow < playlistLength; ++videoRow) {
                var videoStat = playlistChartData.getValue(videoRow, 1);
                var videoTitle = playlistChartData.getValue(videoRow, 4);
                var videoScaledIdx = (plotOptions.scale == ytpa.plot.opts.scale.INDEX) ?
                    videoRow + 1 : videoRow / (playlistLength - 1);

                // TODO: Have video Id here
                var videoId = "";

                playlistChartData.setValue(videoRow, 0, videoScaledIdx);
                playlistChartData.setValue(videoRow, 2,
                    `<div class="ytpa-data-tooltip"><p>
                        <b>Part ${videoRow + 1}</b>: ${videoTitle}<br>
                        <b>${ytpa.plot.opts.data.props[plotOptions.data].name}</b>: ${videoStat}<br>
                        <b>Top comment:</b> ${ytpa.reddit.getTopCommentForLink(videoId, channelName)}
                    </p></div>`
                );
            }

            playlistChartData.removeColumn(4);
            if(plotOptions.type != ytpa.plot.opts.type.AGGREGATE)
                playlistChartData.removeColumn(3);

            playlistChartDataList.push(playlistChartData);
        }

        if(plotOptions.type == ytpa.plot.opts.type.AGGREGATE) {
            var playlistAggFxn = (plotOptions.group == ytpa.plot.opts.group.SUM) ?
                google.visualization.data.sum : google.visualization.data.avg;

            var playlistChartAggDataList = [];
            for(var playlistIdx in playlistChartDataList) {
                var playlistChartData = playlistChartDataList[playlistIdx];
                var playlistChartAggData = google.visualization.data.group(
                    playlistChartData, [3],
                    [{column: 1, type: 'number', aggregation: playlistAggFxn}]);
                playlistChartAggData.addColumn({type: 'string', role: 'tooltip', p: {'html': true}});

                // TODO(JRC): Improve the key column so that it's a normal value.
                var playlistTitle = playlistChartAggData.getValue(0, 0);
                playlistChartAggData.setValue(0, 0, "1");
                playlistChartAggData.setValue(0, 2,
                    `<div class="ytpa-data-tooltip"><p>
                        <b>Playlist Name</b>: ${playlistTitle}<br>
                        <b>${ytpa.plot.opts.group.props[plotOptions.group].name} of 
                        ${ytpa.plot.opts.data.props[plotOptions.data].name}</b>:
                        ${playlistChartAggData.getValue(0, 1)}<br>
                    </p></div>`
                );

                playlistChartAggDataList.push(playlistChartAggData);
            }

            // TODO(JRC): Sort these results so that the output is more readable.
            playlistChartDataList = playlistChartAggDataList;
        }

        var chartData = (playlistChartDataList.length > 0) ? playlistChartDataList.pop() :
            google.visualization.arrayToDataTable([['', {role: 'annotation'}], ['', '']]);
        for(var playlistIdx in playlistChartDataList)
            chartData = google.visualization.data.join(chartData,
                playlistChartDataList[playlistIdx], 'full', [[0, 0]],
                ytpa.lib.range(1, chartData.getNumberOfColumns()), [1, 2]);

        var chartOptions = ytpaGetChartOptions(plotOptions);
        var chart = new chartOptions.type(document.getElementById('ytpa-graph'));

        chart.draw(chartData, chartOptions);
    };

    /// Private Members ///

    /**
     * Generates and returns the charting options associated with 
     */
    function ytpaGetChartOptions(plotOptions) {
        var chartOpts = {};

        chartOpts.title = `Playlist Comparison for "${$('#ytpa-channel').val()}"`;

        chartOpts.hAxis = {
            title: `Playlist ${ytpa.plot.opts.scale.props[plotOptions.scale].name}`,
            baselineColor: '#000000',
            minValue: 1,
        };
        chartOpts.vAxis = {
            title: `${ytpa.plot.opts.data.props[plotOptions.data].name}`,
            baselineColor: '#000000',
        };

        chartOpts.tooltip = {isHtml: true};
        chartOpts.explorer = {axis: 'horizontal', maxZoomOut: 1, keepInBounds: true};
        chartOpts.interpolateNulls = (plotOptions.scale == ytpa.plot.opts.scale.RATIO);

        chartOpts.type = (plotOptions.type == ytpa.plot.opts.type.SERIES) ?
            google.visualization.LineChart : google.visualization.ColumnChart;

        return chartOpts;
    }

    /**
     * Generates and returns the statistic for the given video given the
     * video information and the plot options to be applied.
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
            throw new RangeError(`Data option '${plotOptions.data}' is invalid.`);
        }
    }

    /** A list of all of the playlists that are currently loaded. **/
    var ytpaLoadedPlaylists = {};

    /** A list of all of the playlists currently being plotted. **/
    var ytpaPlottedPlaylists = {};

}(window.ytpa = window.ytpa || {}, jQuery) );
