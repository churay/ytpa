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
        return new Promise(function(resolve) {
            $('#ytpa-channel-submit').click(function(){
                ytpa.plot.clear();

                var channelName = $('#ytpa-channel').val();
                try {
                    ytpa.query.playlists(channelName, 50).then(function(playlists) {
                        var playlistOptions = $('#ytpa-playlist');

                        if(channelName !== playlistOptions.attr('data-playlist')) {
                            playlistOptions.empty();
                            playlistOptions.attr('data-playlist', channelName);

                            for(var playlistIdx in playlists) {
                                var playlist = playlists[playlistIdx];
                                var playlistElement = document.createElement('option');

                                playlistElement.setAttribute('value', playlist.id);
                                playlistElement.innerHTML = playlist.snippet.title;
                                playlistOptions.append(playlistElement);
                            }
                        }
                    });
                } catch(error) {
                    console.log('Invalid channel name!');
                }
            });

            $('#ytpa-playlist').change(function() {
                var playlistObjects = $('#ytpa-playlist option:selected');

                var playlistIDs = playlistObjects.map(function() {
                    return $(this).val(); }).get();
                var playlistNames = playlistObjects.map(function() {
                    return $(this).text(); }).get();

                ytpa.plot.playlists(playlistNames, playlistIDs, ytpaGetPlotOptions());
            });

            $('#ytpa-statistic').change(function() { ytpa.plot.draw(ytpaGetPlotOptions()); });
            $('#ytpa-graphtype').change(function() { ytpa.plot.draw(ytpaGetPlotOptions()); });
            $('#ytpa-scale').change(function() { ytpa.plot.draw(ytpaGetPlotOptions()); });

            $('#ytpa-graph').height($('#ytpa-graph').width());

            resolve();
        });
    }

    /**
     * Returns an object defining all of the options for drawing the visualization plot.
     */
    function ytpaGetPlotOptions() {
        return {
            data: $('#ytpa-statistic').val(),
            repr: $('#ytpa-graphtype').val(),
            scale: $('#ytpa-scale').val(),
        };
    }

}(window.ytpa = window.ytpa || {}, jQuery) );
