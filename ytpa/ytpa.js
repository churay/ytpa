/**
 * @file ytpa.js
 *
 * The main script for the "ytpa" application, which contains global bootstrapping
 * and configuration logic for the application.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    /**
     * The primary initialization function for the "ytpa" library.  This function
     * must be called before calling any other library functions.
     */
    ytpa.init = function() {
        ytpaDocumentWait().then(ytpaDocumentInit).then(function() {
            gapi.client.setApiKey(ytpa.config.appid);
            return gapi.client.load('youtube', 'v3');
        });
    };

    /// Private Members ///

    /**
     * Returns a promise that yields true when the page in which the application
     * is being rendered is ready.
     *
     * @see https://gist.github.com/josh/8177583
     */
    function ytpaDocumentWait() {
        return new Promise(function(resolve) {
            if(document.readyState == 'complete') {
                resolve();
            } else {
                function onReady() {
                    resolve();
                    document.removeEventListener('DOMContentLoaded', onReady, true);
                    window.removeEventListener('load', onReady, true);
                }

                document.addEventListener('DOMContentLoaded', onReady, true);
                window.addEventListener('load', onReady, true);
            }
        });
    }

    /**
     * Returns a promise that yields true when the application page is initialized.
     */
    function ytpaDocumentInit() {
        var redrawFormPlot = function() { ytpa.plot.draw(ytpaGetFormPlotOptions()); };
        var queryNewChannel = function() { ytpaQueryFormChannel(); ytpa.plot.clear(); redrawFormPlot(); };

        return new Promise(function(resolve) {
            $('.selectpicker').selectpicker();

            $('#ytpa-channel').keypress(function(e) { if(e.which == 13) queryNewChannel(); });
            $('#ytpa-channel-submit').click(queryNewChannel);

            $('#ytpa-playlist').change(function() {
                var playlistObjects = $('#ytpa-playlist option:selected');

                var playlistIDs = playlistObjects.map(function() {
                    return $(this).val(); }).get();
                var playlistNames = playlistObjects.map(function() {
                    return $(this).text(); }).get();

                ytpa.plot.playlists(playlistNames, playlistIDs, ytpaGetFormPlotOptions());
            });

            $('#ytpa-statistic').change(redrawFormPlot);
            $('#ytpa-graphtype').change(redrawFormPlot);
            $('#ytpa-scale').change(redrawFormPlot);

            $('#ytpa-graph').height($('#ytpa-graph').width());

            redrawFormPlot();

            resolve();
        });
    }

    /**
     * Queries the channel information for the channel given in the form and
     * populates the form playlists with this channel's information.
     */
    function ytpaQueryFormChannel() {
        var channelName = $('#ytpa-channel').val();
        try {
            ytpa.query.playlists(channelName).then(function(playlists) {
                playlists.sort(function(p1, p2) {
                    return (p1.snippet.title > p2.snippet.title) ? 1 : -1;
                });

                var playlistOptions = $('#ytpa-playlist');
                if(channelName !== playlistOptions.attr('data-playlist')) {
                    playlistOptions.empty();
                    playlistOptions.attr('data-playlist', channelName);

                    for(var playlistIdx in playlists) {
                        var playlist = playlists[playlistIdx];
                        var playlistElement = document.createElement('option');

                        playlistElement.setAttribute('value', playlist.id);
                        playlistElement.setAttribute('class', 'ytpa-select-option');
                        playlistElement.innerHTML = playlist.snippet.title;
                        playlistOptions.append(playlistElement);
                    }
                }

                playlistOptions.selectpicker('refresh');
            });
        } catch(error) {
            console.log('Invalid channel name!');
        }
    }

    /**
     * Returns an object defining all of the options for drawing the visualization plot.
     */
    function ytpaGetFormPlotOptions() {
        return {
            data: $('#ytpa-statistic').val(),
            repr: $('#ytpa-graphtype').val(),
            scale: $('#ytpa-scale').val(),
        };
    }

}(window.ytpa = window.ytpa || {}, jQuery) );
