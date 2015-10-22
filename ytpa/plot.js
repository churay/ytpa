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

        var chartOptions = {
            title: "Number of Views Per Video",
            hAxis: {title: "View Count"},
            vAxis: {title: "Video Number"},
        };
        var chartData = google.visualization.arrayToDataTable([
            ['Year', 'Sales', 'Expenses'],
            ['2004', 1000, 400],
            ['2005', 1170, 460],
            ['2006', 660, 1120],
            ['2007', 1030, 540],
            ['2008', 1030, 540],
            ['2009', 1030, 540]
        ]);

        var chart = new google.visualization.LineChart(document.getElementById("ytpa-graph"));
        chart.draw(chartData, chartOptions);
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
