/**
 * @file plot.js
 *
 * A library script that contains all of the functionality associated with
 * plotting data retrieved by the "ytpa" library.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.plot = ytpa.plot || {};

    ytpa.plot.init = function() {
        $("#ytpa-graph").height($("#ytpa-graph").width());

    };

    ytpa.plot.drawChart = function(videos) {
    	var playlistTitle = $("#ytpa-playlist option:selected").text();

    	var chartRawData = videos.map(function(video, videoIdx) {
                return [parseInt(videoIdx) + 1, parseInt(video.statistics.viewCount)];
            });
        chartRawData.unshift(["View Count", playlistTitle]);

        var chartData = google.visualization.arrayToDataTable(chartRawData);
        var chartOptions = {
            hAxis: {title: "Video Number"},
            vAxis: {title: "View Count"},
        };

        var chart = new google.visualization.LineChart(document.getElementById("ytpa-graph"));
        chart.draw(chartData, chartOptions);
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
