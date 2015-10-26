/**
 * @file events.js
 *
 * 
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.events = ytpa.events || {};

    /*
    *   Handles logic for searching a channel name. Populates the 
    *   playlist selector with options
    */
    $("#ytpa-channel-submit").click(function(){
        var channelName = $("#ytpa-channel").val();

        if (ytpa.storage.checkChannels(channelName)) {
            try {
                ytpa.query.playlists(channelName, 5).then(function(playlists) {
                    var playlistOptions = $("#ytpa-playlist");
                    for(var idx in playlists) {
                        var playlist = document.createElement("option");
                        playlist.setAttribute("value", playlists[idx].id);
                        playlist.innerHTML = playlists[idx].snippet.title;
                        playlistOptions.append(playlist);
                    }
                });
            }
            catch(err) {
                console.log("Invalid channel name");
            }   
        }     
    });

    /*
    *   Handles logic for selecting an option and drawing updated chart
    */
    $("#ytpa-playlist").change(function(){
        var playlistId = $("#ytpa-playlist option:selected").val();

        ytpa.query.playlistvideos(playlistId).then(function(videos) {
            ytpa.plot.drawChart(videos);
        });
    });

}(window.ytpa = window.ytpa || {}, jQuery) );
